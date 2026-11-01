'use strict';

/**
 * mediaProcessorV3.js — Procesamiento de imágenes y videos según especificación V3.
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMINIO:      Media Engine — Pipeline de procesamiento multimedia
 * RESPONSABLE:  Generar variantes normalizadas de imágenes y video
 *
 * NO HACE:
 *   - No decide processing_profile_code (lo resuelve channelProfileMapper)
 *   - No crea media_request (lo hace requestRoutes)
 *   - No evalúa políticas de derechos (lo hace policyEvaluator)
 *   - No escribe en BD (lo hace variantService / originalService)
 *
 * VARIANTES OFICIALES (siempre se generan):
 *   thumb, grid, feed, full, story, cover, avatar → imágenes
 *   short, feed_video, video_preview → video
 *
 * PERFILES DE PROCESAMIENTO:
 *   Las dimensiones de thumb, feed y full varían según el processing_profile_code
 *   definido en channelProfileMapper. Si no hay perfil, usa dimensiones standard.
 *
 * ALMACENAMIENTO: /media/{yyyy}/{mm}/{media_id}/{variant}.{ext}
 *
 * REFERENCIAS:
 *   - channelProfileMapper.js → resolveProfile(channel, mediaType, orientation)
 *   - processingWorker.js → orquesta el pipeline completo
 *   - variantService.js → upsertVariant en me.media_variant
 * ══════════════════════════════════════════════════════════════════════════════
 */

const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const config = require('../../config');

const execFileAsync = promisify(execFile);

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// ─── Perfiles de Procesamiento (según Sección 9 de feed.md) ─────────────────
// thumb, feed y full varían según orientación. grid, story, cover, avatar son fijos.
// ─────────────────────────────────────────────────────────────────────────────

const PROCESSING_PROFILES = {
  standard: {
    // Compatibilidad hacia atrás: dimensiones originales V3
    thumb:  { width: 320, height: 320, fit: 'cover' },
    feed:   { width: 1080, height: 1350, fit: 'inside' },
    full:   { width: 1440, height: null, fit: 'inside' },
  },
  portrait_standard: {
    // 3:5 — 24×40 grid
    thumb: { width: 384, height: 640, fit: 'cover' },
    feed:  { width: 576, height: 960, fit: 'inside' },
    full:  { width: 1080, height: 1800, fit: 'inside' },
  },
  landscape_standard: {
    // 5:3 — 40×24 grid
    thumb: { width: 640, height: 384, fit: 'cover' },
    feed:  { width: 960, height: 576, fit: 'inside' },
    full:  { width: 1800, height: 1080, fit: 'inside' },
  },
  square_standard: {
    // 1:1 — 30×30 grid
    thumb: { width: 320, height: 320, fit: 'cover' },
    feed:  { width: 800, height: 800, fit: 'inside' },
    full:  { width: 1440, height: 1440, fit: 'inside' },
  },
  short_vertical: {
    // 9:16 — solo video, thumb/feed como preview imagen
    thumb: { width: 240, height: 427, fit: 'cover' },
    feed:  { width: 480, height: 854, fit: 'inside' },
    full:  { width: 1080, height: 1920, fit: 'inside' },
  },
};

// ─── Variantes fijas (independientes del perfil) ───────────────────────────

const FIXED_IMAGE_VARIANTS = [
  { code: 'grid', width: 600, height: 600, fit: 'cover', mimeType: 'image/jpeg', ext: 'jpg', quality: 82, isPublic: true },
  { code: 'story', width: 1080, height: 1920, fit: 'inside', mimeType: 'image/jpeg', ext: 'jpg', quality: 85, isPublic: true },
  { code: 'cover', width: 1080, height: 608, fit: 'cover', mimeType: 'image/jpeg', ext: 'jpg', quality: 85, isPublic: true },
  { code: 'avatar', width: 512, height: 512, fit: 'cover', mimeType: 'image/jpeg', ext: 'jpg', quality: 80, isPublic: true },
];

// ─── Variantes de video (fijas) ─────────────────────────────────────────────

// Escalera de video. `fit` gobierna el filtro de escala:
//   pad    → caja fija con letterbox: NUNCA deforma la fuente
//   ladder → altura fija y ancho derivado de la relación real: NUNCA upscalea
// `minSourceHeight` evita generar un peldaño que subiría la resolución del original.
const VIDEO_VARIANTS = [
  { code: 'short', width: 1080, height: 1920, fit: 'pad', mimeType: 'video/mp4', ext: 'mp4', videoBitrate: '2000k', audioBitrate: '128k', fps: 30, isPublic: true },
  { code: 'feed_video', width: 1080, height: 1350, fit: 'pad', mimeType: 'video/mp4', ext: 'mp4', videoBitrate: '2500k', audioBitrate: '128k', fps: 30, isPublic: true },
  { code: 'video_720', height: 720, fit: 'ladder', mimeType: 'video/mp4', ext: 'mp4', videoBitrate: '2000k', audioBitrate: '128k', fps: 30, isPublic: true, minSourceHeight: 0 },
  { code: 'video_1080', height: 1080, fit: 'ladder', mimeType: 'video/mp4', ext: 'mp4', videoBitrate: '4500k', audioBitrate: '128k', fps: 30, isPublic: true, minSourceHeight: 1080 },
];

// Filtro de escala por variante. Sin esto, `size('1080x1920')` deformaba
// cualquier original horizontal y ampliaba los pequeños.
function _buildScaleFilter(variant) {
  if (variant.fit === 'ladder' && variant.height) {
    // -2 garantiza ancho par (exigido por yuv420p) sin alterar la relación.
    return `scale=-2:${variant.height}:flags=lanczos`;
  }
  if (variant.width && variant.height) {
    return `scale=${variant.width}:${variant.height}:force_original_aspect_ratio=decrease,` +
           `pad=${variant.width}:${variant.height}:(ow-iw)/2:(oh-ih)/2:color=black`;
  }
  if (variant.height) {
    return `scale=-2:${variant.height}:flags=lanczos`;
  }
  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function _getDatePath() {
  const d = new Date();
  return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function _buildStoragePath(mediaId, variantCode, ext) {
  return `/media/${_getDatePath()}/${mediaId}/${variantCode}.${ext}`;
}

function _buildUrl(storagePath) {
  return `${config.mediaBaseUrl}${storagePath}`;
}

function _ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function _computeSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', d => hash.update(d));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// ─── Normalización de HEIF/HEIC (formato nativo de la cámara del iPhone) ────
//
// Los binarios precompilados de `sharp` traen libheif sin el plugin HEVC: leen
// la cabecera —`metadata()` devuelve 3468x4624— pero al decodificar abortan con
// «No decoding plugin installed for this compression format (11.6003)». Como
// `image/heic` es el formato por defecto de la cámara del iPhone, toda foto de
// iOS terminaba en `failed` permanente con código UNSUPPORTED_MEDIA.
//
// El `ffmpeg` del motor tampoco sirve: un HEIC es un *tile grid* —12 pistas en
// el original medido— y ffmpeg 7.0.2 ensambla UNA baldosa, devolviendo una
// miniatura de 592x592 en vez de la imagen. Publicar eso sería peor que fallar.
//
// `heif-convert` (libheif-examples + libheif-plugin-libde265) sí reconstruye el
// grid completo. Se usa como paso PREVIO al pipeline y fuera de él: produce un
// JPEG temporal que sharp sí decodifica. El original nunca se modifica y su
// sha256 se calcula sobre sus propios bytes, de modo que la identidad del media
// y la detección de duplicados no cambian.
const HEIF_HEVC_BRANDS = new Set(['heic', 'heix', 'hevc', 'heim', 'heis', 'hevm', 'hevs']);

/**
 * Indica si el archivo es un contenedor ISO-BMFF con codificación HEVC (HEIC).
 *
 * Se lee la cabecera en lugar de confiar en la extensión o en el mime declarado
 * por el cliente: un `.heic` renombrado a `.jpg` sigue siendo HEIC, y un AVIF
 * (`avif`) sí lo decodifica sharp, así que no debe pasar por esta ruta.
 */
function _detectHeifHevc(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const head = Buffer.alloc(32);
    const leidos = fs.readSync(fd, head, 0, 32, 0);
    if (leidos < 12) return false;
    if (head.toString('ascii', 4, 8) !== 'ftyp') return false;
    if (HEIF_HEVC_BRANDS.has(head.toString('ascii', 8, 12).trim())) return true;
    // Un HEIC puede declarar `mif1` como marca mayor y `heic` entre las marcas
    // compatibles, que empiezan en el offset 16.
    for (let off = 16; off + 4 <= leidos; off += 4) {
      if (HEIF_HEVC_BRANDS.has(head.toString('ascii', off, off + 4).trim())) return true;
    }
    return false;
  } catch (err) {
    return false;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch (_) { /* irrelevante */ }
    }
  }
}

/**
 * Devuelve una ruta que `sharp` puede decodificar para un original de imagen.
 *
 * Si el archivo no es HEIC devuelve la ruta original sin coste. Si lo es, genera
 * un JPEG temporal y devuelve junto a la ruta su `cleanup()`; quien llama DEBE
 * invocarlo cuando termine, incluso si el pipeline falla.
 *
 * @param {string} rawPath Ruta absoluta al original.
 * @returns {Promise<{path: string, converted: boolean, cleanup: () => Promise<void>}>}
 */
async function prepareImageSource(rawPath) {
  const sinCambios = { path: rawPath, converted: false, cleanup: async () => {} };
  if (!_detectHeifHevc(rawPath)) return sinCambios;

  const base = path.join(
    os.tmpdir(),
    `me-heif-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
  );
  const tmpPath = `${base}.jpg`;

  // Un HEIC puede contener varias imágenes y entonces heif-convert nombra la
  // salida `<base>-1.jpg`, `<base>-2.jpg`… Se limpian todas por prefijo.
  const cleanup = async () => {
    try {
      const dir = path.dirname(base);
      const prefijo = path.basename(base);
      const sobrantes = (await fs.promises.readdir(dir)).filter(f => f.startsWith(prefijo));
      await Promise.all(sobrantes.map(f => fs.promises.unlink(path.join(dir, f)).catch(() => {})));
    } catch (_) { /* el temporal no debe romper el job */ }
  };

  try {
    // -q 100: el JPEG es intermedio, se recorta después. Sin cuantización
    // adicional visible antes del resize de variantes.
    await execFileAsync(
      config.media.heifConvertBin,
      ['-q', '100', rawPath, tmpPath],
      { timeout: config.media.heifConvertTimeoutMs, maxBuffer: 8 * 1024 * 1024 }
    );
  } catch (err) {
    await cleanup();
    if (err && err.code === 'ENOENT') {
      throw new Error(
        `HEIC no decodificable: heif-convert no está instalado (${config.media.heifConvertBin})`
      );
    }
    const detalle = String((err && (err.stderr || err.message)) || '').trim().slice(0, 200);
    throw new Error(`HEIC no decodificable: heif-convert falló (${detalle})`);
  }

  // Salida única (`<base>.jpg`) o primera imagen del contenedor (`<base>-1.jpg`).
  let producido = tmpPath;
  if (!fs.existsSync(producido)) {
    const primera = `${base}-1.jpg`;
    if (fs.existsSync(primera)) producido = primera;
  }
  if (!fs.existsSync(producido) || fs.statSync(producido).size === 0) {
    await cleanup();
    throw new Error('HEIC no decodificable: heif-convert no produjo salida');
  }

  return { path: producido, converted: true, cleanup };
}


function _getAspectRatio(width, height) {
  if (!width || !height) return null;
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function _detectOrientation(width, height) {
  if (!width || !height) return 'square';
  if (width > height) return 'landscape';
  if (width < height) return 'portrait';
  return 'square';
}

function _detectExtension(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
  };
  return map[mimeType] || 'bin';
}

// ─── Watermark: escalado al lienzo de cada variante ─────────────────────────
// El logo maestro (src/assets/watermark/bitmap.png) mide 533x533. Casi todas
// las variantes son menores que él —thumb 320x320, portrait_standard 384x640,
// landscape_standard 640x384, short_vertical 240x427, avatar 512x512— y sharp
// NO escala la imagen de `composite`: cuando el overlay excede el lienzo aborta
// con "Image to composite must have same dimensions or smaller" y se lleva por
// delante el job completo. El overlay se dimensiona como fracción del lado
// menor del lienzo resultante, con mínimo legible y techo absoluto, de modo que
// quepa por construcción en cualquier perfil y orientación.
const WATERMARK_RATIO = 0.18;
const WATERMARK_MIN_PX = 24;
const WATERMARK_MAX_PX = 240;

/**
 * Cota superior segura del lado menor del lienzo que producirá el resize.
 *
 * `withoutEnlargement: true` impide agrandar, así que el resultado nunca supera
 * las dimensiones del original. Con `fit: 'cover'` el resultado se recorta al
 * box; con `fit: 'inside'` cabe dentro del box. En ambos casos el mínimo de
 * {original, box} es una cota superior del lado menor real.
 */
function _resolveCanvasSide(srcWidth, srcHeight, opts) {
  let side = Math.min(srcWidth, srcHeight);
  if (opts.width) side = Math.min(side, opts.width);
  if (opts.height) side = Math.min(side, opts.height);
  return Math.max(1, side);
}

/**
 * Construye el overlay del watermark ya escalado al lienzo destino.
 *
 * @returns {Promise<Buffer|null>} PNG listo para `composite`, o null si no
 *          puede construirse (lienzo diminuto, logo ilegible o error de sharp).
 */
async function _buildWatermarkOverlay(watermarkPath, srcWidth, srcHeight, resizeOptions) {
  if (!srcWidth || !srcHeight) return null;
  try {
    const canvasSide = _resolveCanvasSide(srcWidth, srcHeight, resizeOptions);
    const target = Math.min(
      WATERMARK_MAX_PX,
      canvasSide,
      Math.max(WATERMARK_MIN_PX, Math.round(canvasSide * WATERMARK_RATIO))
    );
    // Un lienzo menor que el mínimo legible no admite marca útil.
    if (target < WATERMARK_MIN_PX) return null;

    return await sharp(watermarkPath)
      .resize({ width: target, height: target, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch (err) {
    console.warn('[mediaProcessor] Overlay de watermark no construido:', err.message);
    return null;
  }
}

// ─── Procesamiento de Imágenes ──────────────────────────────────────────────

/**
 * Procesa una imagen generando variantes según perfil de procesamiento.
 *
 * @param {string} rawPath       - Ruta absoluta al archivo original
 * @param {string} mediaId       - UUID del media
 * @param {object} [options]
 * @param {boolean} [options.applyWatermark]       - Si aplicar watermark
 * @param {string} [options.watermarkPath]         - Ruta del logo de watermark
 * @param {string} [options.processingProfileCode] - Código del perfil (standard, portrait_standard, etc.)
 * @param {string} [options.sourceImagePath]       - Ruta ya decodificable por sharp (un HEIC ya
 *        normalizado). Si se omite, se prepara aquí y el temporal se limpia al terminar.
 * @returns {Promise<object>}    - { sha256, width, height, orientation, variants }
 */
async function processImage(rawPath, mediaId, options = {}) {
  // El sha256 identifica al media y alimenta la detección de duplicados: se
  // calcula SIEMPRE sobre los bytes del original, nunca sobre el JPEG temporal
  // que se produzca al normalizar un HEIC.
  const sha256 = await _computeSha256(rawPath);

  // El pipeline de variantes lee el archivo siete veces; si `processingWorker`
  // ya normalizó el original (lo necesita antes, para resolver la orientación y
  // con ella el perfil), se reutiliza esa ruta en vez de convertir dos veces.
  const propio = !options.sourceImagePath;
  const source = propio
    ? await prepareImageSource(rawPath)
    : { path: options.sourceImagePath, converted: false, cleanup: async () => {} };

  try {
    const metadata = await sharp(source.path).metadata();
    const profileCode = options.processingProfileCode || 'standard';
    const profile = PROCESSING_PROFILES[profileCode] || PROCESSING_PROFILES.standard;
    const variants = [];

    // Dimensiones del original reutilizadas por el compositor de watermark: evita
    // una lectura de cabecera por variante (7 por imagen).
    const variantOptions = {
      ...options,
      sourceMeta: { width: metadata.width, height: metadata.height },
    };

    // 1. Variantes dependientes del perfil: thumb, feed, full
    const profileVariants = [
      { code: 'thumb', ...profile.thumb, mimeType: 'image/jpeg', ext: 'jpg', quality: 80, isPublic: true },
      { code: 'feed', ...profile.feed, mimeType: 'image/jpeg', ext: 'jpg', quality: 85, isPublic: true },
      { code: 'full', ...profile.full, mimeType: 'image/jpeg', ext: 'jpg', quality: 88, isPublic: true },
    ];

    for (const v of profileVariants) {
      const variant = await _processSingleImage(source.path, mediaId, v, variantOptions);
      variant.processingProfileCode = profileCode;
      variant.profileVersion = 2;
      variants.push(variant);
    }

    // 2. Variantes fijas (independientes del perfil)
    for (const v of FIXED_IMAGE_VARIANTS) {
      const variant = await _processSingleImage(source.path, mediaId, v, variantOptions);
      variant.processingProfileCode = 'standard';
      variant.profileVersion = 1;
      variants.push(variant);
    }

    // 3. Detectar orientación
    const orientation = _detectOrientation(metadata.width, metadata.height);

    return {
      sha256,
      width: metadata.width,
      height: metadata.height,
      orientation,
      variants,
    };
  } finally {
    if (propio) await source.cleanup();
  }
}

/**
 * Procesa una variante individual de imagen.
 */
async function _processSingleImage(rawPath, mediaId, variantDef, options) {
  const storagePath = _buildStoragePath(mediaId, variantDef.code, variantDef.ext);
  const absolutePath = path.join(config.uploadsDir, storagePath);
  _ensureDir(absolutePath);

  const resizeOptions = {
    withoutEnlargement: true,
  };

  if (variantDef.fit === 'cover') {
    resizeOptions.width = variantDef.width;
    resizeOptions.height = variantDef.height;
    resizeOptions.fit = 'cover';
    resizeOptions.position = 'centre';
  } else {
    resizeOptions.width = variantDef.width;
    if (variantDef.height) resizeOptions.height = variantDef.height;
    resizeOptions.fit = 'inside';
  }

  // Overlay del watermark dimensionado al lienzo de ESTA variante. Se construye
  // una sola vez por variante y se reutiliza en el reintento sin marca.
  let overlay = null;
  if (options.applyWatermark && options.watermarkPath && fs.existsSync(options.watermarkPath)) {
    const src = options.sourceMeta || await sharp(rawPath).metadata();
    overlay = await _buildWatermarkOverlay(options.watermarkPath, src.width, src.height, resizeOptions);
  }

  const encode = (withOverlay) => {
    let pipeline = sharp(rawPath).resize(resizeOptions);
    if (withOverlay && overlay) {
      pipeline = pipeline.composite([{
        input: overlay,
        gravity: 'southeast',
        blend: 'over',
        opacity: 0.7,
      }]);
    }
    return pipeline.jpeg({ quality: variantDef.quality, mozjpeg: true }).toFile(absolutePath);
  };

  let hasWatermark = Boolean(overlay);
  try {
    await encode(hasWatermark);
  } catch (err) {
    // La marca es una política editorial, no un requisito de integridad del
    // media: si sharp rechaza el overlay, la variante se emite sin marca y se
    // registra, en lugar de arrastrar el job completo a dead_letter.
    if (!hasWatermark) throw err;
    console.warn(
      `[mediaProcessor] Watermark descartado en variante '${variantDef.code}' media_id=${mediaId}: ${err.message}`
    );
    hasWatermark = false;
    await encode(false);
  }

  const resultMeta = await sharp(absolutePath).metadata();

  return {
    mediaId,
    variantCode: variantDef.code,
    mediaType: 'image',
    url: _buildUrl(storagePath),
    storagePath,
    mimeType: variantDef.mimeType,
    width: resultMeta.width,
    height: resultMeta.height,
    sizeBytes: fs.statSync(absolutePath).size,
    aspectRatio: _getAspectRatio(resultMeta.width, resultMeta.height),
    hasWatermark,
    isPublic: variantDef.isPublic,
  };
}

// ─── Procesamiento de Videos ────────────────────────────────────────────────

/**
 * Procesa un video generando variantes y preview.
 *
 * @param {string} rawPath
 * @param {string} mediaId
 * @param {object} [options]
 * @param {string} [options.processingProfileCode] - Perfil de procesamiento (short_vertical, etc.)
 * @returns {Promise<object>}
 */
async function processVideo(rawPath, mediaId, options = {}) {
  const sha256 = await _computeSha256(rawPath);
  const probeData = await _probeVideo(rawPath);
  const variants = [];
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? options.timeoutMs
    : config.worker.videoTimeoutMs;

  // 1. Video Preview (thumbnail del primer frame)
  //    Se extrae el frame a su tamaño nativo y se reduce con sharp respetando la
  //    relación; `size: '720x1280'` aplanaba y deformaba el poster.
  const previewStoragePath = _buildStoragePath(mediaId, 'video_preview', 'jpg');
  const previewAbsolutePath = path.join(config.uploadsDir, previewStoragePath);
  _ensureDir(previewAbsolutePath);

  await new Promise((resolve, reject) => {
    ffmpeg(rawPath)
      .screenshots({
        count: 1,
        folder: path.dirname(previewAbsolutePath),
        filename: path.basename(previewAbsolutePath),
      })
      .on('end', resolve)
      .on('error', reject);
  });

  const previewBuffer = await sharp(previewAbsolutePath)
    .rotate()
    .resize(720, 1280, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  fs.writeFileSync(previewAbsolutePath, previewBuffer);

  const previewMeta = await sharp(previewAbsolutePath).metadata();
  variants.push({
    mediaId,
    variantCode: 'video_preview',
    mediaType: 'image',
    url: _buildUrl(previewStoragePath),
    storagePath: previewStoragePath,
    mimeType: 'image/jpeg',
    width: previewMeta.width,
    height: previewMeta.height,
    sizeBytes: fs.statSync(previewAbsolutePath).size,
    aspectRatio: _getAspectRatio(previewMeta.width, previewMeta.height),
    hasWatermark: false,
    isPublic: true,
    processingProfileCode: options.processingProfileCode || 'short_vertical',
    profileVersion: 2,
  });

  // 2. Variantes de video
  //
  //    Esta es la parte dominante del tiempo de procesamiento: con el `for`
  //    secuencial cada variante pagaba un transcode completo antes de que la
  //    siguiente empezara, y `short` (1080x1920) más `feed_video` (1080x1350)
  //    sobre un clip de un minuto bastaban para rebasar el techo de espera del
  //    cliente. Las variantes son independientes entre sí, así que se generan
  //    con concurrencia acotada: el host tiene 4 vCPU y el Engine comparte
  //    máquina con el Gateway y las APIs, de modo que el límite no es la CPU
  //    disponible sino no dejarla sin CPU a los demás.
  const sourceHeight = Number(probeData.height || 0);
  const concurrency = Math.max(1, config.worker.videoConcurrency || 2);

  const generadas = await _mapWithConcurrency(VIDEO_VARIANTS, concurrency, async (v) => {
    // No generar un peldaño que subiría la resolución de la fuente.
    if (v.minSourceHeight && sourceHeight > 0 && sourceHeight < v.minSourceHeight) {
      console.log(`[mediaProcessor] ${v.code} omitida: fuente ${sourceHeight}px < ${v.minSourceHeight}px`);
      return null;
    }

    const storagePath = _buildStoragePath(mediaId, v.code, v.ext);
    const absolutePath = path.join(config.uploadsDir, storagePath);
    _ensureDir(absolutePath);

    try {
      await _transcodeVideo(rawPath, absolutePath, v, { timeoutMs, concurrency });
    } catch (err) {
      // La escalera (video_720 / video_1080) es aditiva: si falla, el media
      // conserva short y feed_video y el cliente degrada con COALESCE.
      if (v.minSourceHeight !== undefined) {
        console.warn(`[mediaProcessor] Variante ${v.code} no generada media_id=${mediaId}:`, err.message);
        return null;
      }
      throw err;
    }

    const probeOut = await _probeVideo(absolutePath);

    return {
      mediaId,
      variantCode: v.code,
      mediaType: 'video',
      url: _buildUrl(storagePath),
      storagePath,
      mimeType: v.mimeType,
      width: probeOut.width,
      height: probeOut.height,
      durationMs: Math.round(probeOut.duration * 1000),
      sizeBytes: fs.statSync(absolutePath).size,
      aspectRatio: _getAspectRatio(probeOut.width, probeOut.height),
      codec: 'h264',
      bitrateKbps: parseInt(v.videoBitrate, 10),
      fps: v.fps,
      // El camino de vídeo no compone watermark: declarar aquí
      // Boolean(options.applyWatermark) escribía en media_variant una marca
      // que el archivo no lleva. Hasta que FFmpeg aplique el overlay, el dato
      // honesto es false.
      hasWatermark: false,
      isPublic: v.isPublic,
      processingProfileCode: options.processingProfileCode || 'short_vertical',
      profileVersion: 2,
    };
  });

  for (const variante of generadas) {
    if (variante) variants.push(variante);
  }

  return {
    sha256,
    width: probeData.width,
    height: probeData.height,
    durationMs: Math.round(probeData.duration * 1000),
    orientation: null,
    variants,
  };
}

/**
 * Ejecuta `fn` sobre `items` con un máximo de `limit` promesas en vuelo.
 * Se usa para los transcodes de video: lanzar los cuatro peldaños a la vez
 * satura la máquina y los hace más lentos que en serie, pero dos a la vez
 * aprovechan núcleos que en serie quedaban ociosos.
 *
 * @template T,R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} fn
 * @returns {Promise<R[]>} resultados en el mismo orden de `items`
 */
async function _mapWithConcurrency(items, limit, fn) {
  const resultados = new Array(items.length);
  let siguiente = 0;

  const worker = async () => {
    while (true) {
      const i = siguiente++;
      if (i >= items.length) return;
      resultados[i] = await fn(items[i], i);
    }
  };

  const pool = Array.from({ length: Math.min(Math.max(1, limit), items.length) }, worker);
  await Promise.all(pool);
  return resultados;
}

function _probeVideo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      const stream = data.streams.find(s => s.codec_type === 'video');
      resolve({
        width: stream?.width || 0,
        height: stream?.height || 0,
        duration: parseFloat(data.format.duration || 0),
        codec: stream?.codec_name || 'unknown',
      });
    });
  });
}

function _transcodeVideo(inputPath, outputPath, variant, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? options.timeoutMs
    : config.worker.videoTimeoutMs;

  // x264 reparte hilos por su cuenta tomando todos los núcleos visibles. Con
  // dos transcodes en paralelo eso significa 2N hilos sobre N núcleos y el
  // planificador los alterna: cada uno tarda más y el resultado es peor que
  // en serie. Repartir los núcleos entre los transcodes en vuelo mantiene la
  // suma bajo el total real de la máquina.
  const nucleos = Number(os.cpus()?.length) || 2;
  const enVuelo = Math.max(1, Number(options.concurrency) || 1);
  const hilos = Math.max(1, Math.floor(nucleos / enVuelo));

  return new Promise((resolve, reject) => {
    let settled = false;
    let timerHandle = null;

    const cmd = ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-movflags', '+faststart',
        '-pix_fmt', 'yuv420p',
        '-preset', config.worker.videoPreset || 'medium',
        '-threads', String(hilos),
      ]);

    const filter = _buildScaleFilter(variant);
    if (filter) {
      cmd.videoFilters(filter);
    }

    cmd.videoBitrate(variant.videoBitrate)
      .audioBitrate(variant.audioBitrate)
      .fps(variant.fps || 30);

    const finish = (err) => {
      if (settled) return;
      settled = true;
      if (timerHandle) {
        clearTimeout(timerHandle);
        timerHandle = null;
      }
      // Un transcode abortado deja un mp4 parcial que nunca debe publicarse.
      if (err) {
        try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) { /* noop */ }
        return reject(err);
      }
      resolve();
    };

    cmd.on('end', () => finish()).on('error', (err) => finish(err));

    // Techo real de ejecución: sin esto un ffmpeg colgado bloquea la cola
    // completa, porque el worker atiende un job a la vez.
    if (timeoutMs > 0) {
      timerHandle = setTimeout(() => {
        const err = new Error(
          `Transcode ${variant.code} excedió ${Math.round(timeoutMs / 1000)}s y fue abortado`,
        );
        err.code = 'TRANSCODE_TIMEOUT';
        try { cmd.kill('SIGKILL'); } catch (_) { /* noop */ }
        finish(err);
      }, timeoutMs);
      if (typeof timerHandle.unref === 'function') timerHandle.unref();
    }

    cmd.run();
  });
}

// ─── Procesamiento de Audio ─────────────────────────────────────────────────
//
// El motor NO edita audio: no hay transcodificación ni normalización de sonido
// en esta fase. Lo que sí hace es lo que le corresponde como Engine:
//   · leer la fuente con ffprobe (duración, códec, bitrate),
//   · declarar la variante pública 'audio_full',
//   · y devolver la metadata que la card necesita para reproducirla.
//
// La variante apunta al ORIGINAL ya archivado por la ruta POST /:mediaId/original.
// No se copia ni se duplica el binario: `audio_full` es una vista pública y
// medible del mismo archivo, que es exactamente lo que el modelo exige
// (Media Engine conserva media compartida; nadie la duplica).

const MIME_POR_EXT_AUDIO = {
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/opus',
  webm: 'audio/webm',
  caf: 'audio/x-caf',
  '3gp': 'audio/3gpp',
  amr: 'audio/amr',
};

function _mimeForAudioExt(ext) {
  return MIME_POR_EXT_AUDIO[String(ext || '').toLowerCase()] || 'audio/mpeg';
}

function _probeAudio(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      const stream = (data.streams || []).find(s => s.codec_type === 'audio');
      const bitrate = Number(data.format?.bit_rate || 0);
      resolve({
        duration: parseFloat(data.format?.duration || 0),
        codec: stream?.codec_name || 'unknown',
        bitrateKbps: bitrate > 0 ? Math.round(bitrate / 1000) : null,
        channels: stream?.channels || null,
        sampleRate: stream?.sample_rate ? Number(stream.sample_rate) : null,
      });
    });
  });
}

/**
 * Procesa un audio fuente: mide y publica la referencia al original.
 *
 * @param {string} rawPath     — ruta local del original ya archivado
 * @param {string} mediaId     — UUID del media request
 * @param {object} [options]
 * @param {string} [options.processingProfileCode]
 * @returns {Promise<object>}
 */
async function processAudio(rawPath, mediaId, options = {}) {
  const sha256 = await _computeSha256(rawPath);
  const probeData = await _probeAudio(rawPath);
  const stats = fs.statSync(rawPath);

  const ext = path.extname(rawPath).replace('.', '').toLowerCase() || 'm4a';
  const mimeType = _mimeForAudioExt(ext);

  // storagePath relativo al directorio de uploads — el original NO se mueve.
  const relativo = path.relative(config.uploadsDir, rawPath).split(path.sep).join('/');
  const storagePath = relativo.startsWith('/') ? relativo : `/${relativo}`;
  const durationMs = Math.round((probeData.duration || 0) * 1000);

  const variants = [{
    mediaId,
    variantCode: 'audio_full',
    mediaType: 'audio',
    url: _buildUrl(storagePath),
    storagePath,
    mimeType,
    width: null,
    height: null,
    durationMs,
    sizeBytes: stats.size,
    aspectRatio: null,
    codec: probeData.codec,
    bitrateKbps: probeData.bitrateKbps,
    fps: null,
    hasWatermark: false,
    isPublic: 1,
    processingProfileCode: options.processingProfileCode || 'standard',
    profileVersion: 1,
  }];

  return {
    sha256,
    width: null,
    height: null,
    durationMs,
    orientation: null,
    variants,
  };
}

module.exports = {
  processImage, processVideo, processAudio,
  prepareImageSource,
  PROCESSING_PROFILES, FIXED_IMAGE_VARIANTS, VIDEO_VARIANTS,
  _detectOrientation,
  _probeAudio, _mimeForAudioExt,
};
