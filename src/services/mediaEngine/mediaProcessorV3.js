'use strict';

/**
 * mediaProcessorV3.js — Procesamiento de imágenes y videos según especificación V3.
 *
 * Variantes oficiales:
 *   Imágenes: thumb (320x320), grid (600x600), feed (1080x1350), full (1440),
 *             story (1080x1920), cover (1080x608), avatar (512x512)
 *   Videos:   short (1080x1920), feed_video (1080x1350/1920), video_preview (720x1280)
 *
 * Almacenamiento: /media/{yyyy}/{mm}/{media_id}/{variant}.{ext}
 */

const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../../config');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// ─── Configuración de variantes según especificación V3 ─────────────────────

const IMAGE_VARIANTS = [
  { code: 'thumb', width: 320, height: 320, fit: 'cover', mimeType: 'image/jpeg', ext: 'jpg', quality: 80, isPublic: true },
  { code: 'grid', width: 600, height: 600, fit: 'cover', mimeType: 'image/jpeg', ext: 'jpg', quality: 82, isPublic: true },
  { code: 'feed', width: 1080, height: 1350, fit: 'inside', mimeType: 'image/jpeg', ext: 'jpg', quality: 85, isPublic: true },
  { code: 'full', width: 1440, height: null, fit: 'inside', mimeType: 'image/jpeg', ext: 'jpg', quality: 88, isPublic: true },
  { code: 'story', width: 1080, height: 1920, fit: 'inside', mimeType: 'image/jpeg', ext: 'jpg', quality: 85, isPublic: true },
  { code: 'cover', width: 1080, height: 608, fit: 'cover', mimeType: 'image/jpeg', ext: 'jpg', quality: 85, isPublic: true },
  { code: 'avatar', width: 512, height: 512, fit: 'cover', mimeType: 'image/jpeg', ext: 'jpg', quality: 80, isPublic: true },
];

const VIDEO_VARIANTS = [
  { code: 'short', width: 1080, height: 1920, mimeType: 'video/mp4', ext: 'mp4', videoBitrate: '2000k', audioBitrate: '128k', fps: 30, isPublic: true },
  { code: 'feed_video', width: 1080, height: 1350, mimeType: 'video/mp4', ext: 'mp4', videoBitrate: '2500k', audioBitrate: '128k', fps: 30, isPublic: true },
];

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

function _getAspectRatio(width, height) {
  if (!width || !height) return null;
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
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

// ─── Procesamiento de Imágenes ──────────────────────────────────────────────

/**
 * Procesa una imagen generando todas las variantes V3.
 *
 * @param {string} rawPath       - Ruta absoluta al archivo original
 * @param {string} mediaId       - UUID del media
 * @param {object} [options]
 * @param {boolean} [options.applyWatermark]   - Si aplicar watermark
 * @param {string} [options.watermarkPath]     - Ruta del logo de watermark
 * @returns {Promise<Array>}     - Lista de objetos variante
 */
async function processImage(rawPath, mediaId, options = {}) {
  const metadata = await sharp(rawPath).metadata();
  const sha256 = await _computeSha256(rawPath);
  const variants = [];

  for (const v of IMAGE_VARIANTS) {
    const storagePath = _buildStoragePath(mediaId, v.code, v.ext);
    const absolutePath = path.join(config.uploadsDir, storagePath);
    _ensureDir(absolutePath);

    const resizeOptions = {
      withoutEnlargement: true,
    };

    if (v.fit === 'cover') {
      resizeOptions.width = v.width;
      resizeOptions.height = v.height;
      resizeOptions.fit = 'cover';
      resizeOptions.position = 'centre';
    } else {
      resizeOptions.width = v.width;
      if (v.height) resizeOptions.height = v.height;
      resizeOptions.fit = 'inside';
    }

    let pipeline = sharp(rawPath).resize(resizeOptions);

    // Aplicar watermark si es necesario
    if (options.applyWatermark && options.watermarkPath && fs.existsSync(options.watermarkPath)) {
      pipeline = pipeline.composite([{
        input: options.watermarkPath,
        gravity: 'southeast',
        blend: 'over',
        opacity: 0.7,
      }]);
    }

    await pipeline.jpeg({ quality: v.quality, mozjpeg: true }).toFile(absolutePath);

    const resultMeta = await sharp(absolutePath).metadata();

    variants.push({
      mediaId,
      variantCode: v.code,
      mediaType: 'image',
      url: _buildUrl(storagePath),
      storagePath,
      mimeType: v.mimeType,
      width: resultMeta.width,
      height: resultMeta.height,
      sizeBytes: fs.statSync(absolutePath).size,
      aspectRatio: _getAspectRatio(resultMeta.width, resultMeta.height),
      hasWatermark: Boolean(options.applyWatermark),
      isPublic: v.isPublic,
      processingProfileCode: 'standard',
      profileVersion: 1,
    });
  }

  return {
    sha256,
    width: metadata.width,
    height: metadata.height,
    orientation: metadata.orientation ? String(metadata.orientation) : null,
    variants,
  };
}

// ─── Procesamiento de Videos ────────────────────────────────────────────────

/**
 * Procesa un video generando variantes y preview.
 *
 * @param {string} rawPath
 * @param {string} mediaId
 * @param {object} [options]
 * @returns {Promise<object>}
 */
async function processVideo(rawPath, mediaId, options = {}) {
  const sha256 = await _computeSha256(rawPath);
  const probeData = await _probeVideo(rawPath);
  const variants = [];

  // 1. Video Preview (thumbnail del primer frame)
  const previewStoragePath = _buildStoragePath(mediaId, 'video_preview', 'jpg');
  const previewAbsolutePath = path.join(config.uploadsDir, previewStoragePath);
  _ensureDir(previewAbsolutePath);

  await new Promise((resolve, reject) => {
    ffmpeg(rawPath)
      .screenshots({
        count: 1,
        folder: path.dirname(previewAbsolutePath),
        filename: path.basename(previewAbsolutePath),
        size: '720x1280',
      })
      .on('end', resolve)
      .on('error', reject);
  });

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
    processingProfileCode: 'standard',
    profileVersion: 1,
  });

  // 2. Variantes de video
  for (const v of VIDEO_VARIANTS) {
    const storagePath = _buildStoragePath(mediaId, v.code, v.ext);
    const absolutePath = path.join(config.uploadsDir, storagePath);
    _ensureDir(absolutePath);

    await _transcodeVideo(rawPath, absolutePath, v);

    const probeOut = await _probeVideo(absolutePath);

    variants.push({
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
      hasWatermark: Boolean(options.applyWatermark),
      isPublic: v.isPublic,
      processingProfileCode: 'standard',
      profileVersion: 1,
    });
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

function _transcodeVideo(inputPath, outputPath, variant) {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-movflags', '+faststart',
        '-pix_fmt', 'yuv420p',
        '-preset', 'medium',
      ]);

    if (variant.width && variant.height) {
      cmd.size(`${variant.width}x${variant.height}`);
    } else if (variant.height) {
      cmd.size(`?x${variant.height}`);
    }

    cmd.videoBitrate(variant.videoBitrate)
      .audioBitrate(variant.audioBitrate)
      .fps(variant.fps || 30);

    cmd.on('end', resolve)
      .on('error', reject)
      .run();
  });
}

module.exports = { processImage, processVideo, IMAGE_VARIANTS, VIDEO_VARIANTS };
