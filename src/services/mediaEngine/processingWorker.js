'use strict';

/**
 * processingWorker.js — Worker de procesamiento background V3.
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMINIO:      Media Engine — Pipeline de procesamiento background multi-servicio
 * RESPONSABLE:  Orquestar el ciclo completo: pick job → process → mark ready
 *
 * NO HACE:
 *   - No expone endpoints HTTP (lo hace mediaRoutes)
 *   - No decide políticas de derechos (lo hace policyEvaluator)
 *   - No conoce de posts, sponsors ni ningún servicio en específico
 *     (consulta serviceRegistry para adaptadores por sourceApp)
 *   - No ejecuta múltiples workers simultáneos (usa worker locking)
 *
 * PIPELINE:
 *   pick_next_job → mark_running → evaluate_policy →
 *   detect_orientation → resolve_profile (vía serviceRegistry) →
 *   generate_variants → upsert_variants → mark_ready
 *
 * PERFILES:
 *   El processing_profile_code se resuelve así:
 *     1. Si media_request ya tiene processing_profile_code → usarlo
 *     2. Si no → serviceRegistry.getChannelProfileMapper(sourceApp).resolveProfile()
 *     3. Si no hay mapper → 'standard' (compatibilidad)
 *
 * REFERENCIAS:
 *   - serviceRegistry.js → getChannelProfileMapper(sourceApp)
 *   - mediaProcessorV3.js → processImage / processVideo
 *   - variantService.js → upsertVariant / markReady
 *   - apps-antojados/docs/feed.md (Sección 9: Perfiles de procesamiento)
 * ══════════════════════════════════════════════════════════════════════════════
 */

const config = require('../../config');
const variantService = require('./variantService');
const requestService = require('./requestService');
const rightsService = require('./rightsService');
const policyEvaluator = require('./policyEvaluator');
const mediaProcessor = require('./mediaProcessorV3');
const originalService = require('./originalService');
const serviceRegistry = require('../serviceRegistry');

let timer = null;
let running = false;

function start() {
  if (timer) return;
  console.log(`[processingWorker] Iniciado, polling cada ${config.worker.pollIntervalMs / 1000}s`);
  timer = setInterval(cycle, config.worker.pollIntervalMs);
  cycle(); // primer ciclo inmediato
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('[processingWorker] Detenido');
  }
}

async function cycle() {
  if (running) return; // evitar solapamiento
  running = true;

  try {
    for (let i = 0; i < config.worker.maxBatch; i++) {
      const job = await variantService.pickNextJob();
      if (!job) break; // no hay más jobs

      await processJob(job);
    }
  } catch (err) {
    console.error('[processingWorker] Error en ciclo:', err.message);
  } finally {
    running = false;
  }
}

async function processJob(job) {
  const { job_id: jobId, media_id: mediaId, job_type: jobType } = job;
  console.log(`[processingWorker] Procesando job_id=${jobId}, media_id=${mediaId}, type=${jobType}`);

  try {
    // 1. Marcar job como running
    await variantService.markJobRunning(jobId);

    // 2. Obtener metadata del media request
    const mediaRequest = await requestService.getById(mediaId);
    if (!mediaRequest) {
      throw new Error(`Media request no encontrado: ${mediaId}`);
    }

    // 3. Evaluar política de derechos (nunca bloquea)
    const policy = await policyEvaluator.evaluate(mediaId);
    // policy.canProcess siempre es true (fail open)
    const applyWatermark = policy.shouldApplyEngineWatermark;
    const watermarkProfileCode = policy.watermarkProfileCode || null;

    // 4. Obtener datos del original (solo para metadata)
    const rights = await rightsService.getRightsOrigin(mediaId);

    // 5. Determinar ruta del archivo original
    const original = await _getOriginalRecord(mediaId);
    if (!original || !original.original_storage_path) {
      throw new Error(`Original no registrado para media_id=${mediaId}`);
    }

    const rawPath = original.original_storage_path;
    if (!require('fs').existsSync(rawPath)) {
      throw new Error(`Archivo original no encontrado: ${rawPath}`);
    }

    // 6. Detectar orientación del original (si es imagen)
    let orientation = null;
    if (mediaRequest.media_type === 'image') {
      try {
        const metadata = require('sharp')(rawPath).metadata();
        orientation = _detectOrientation(metadata.width, metadata.height);
      } catch (_) {
        orientation = null;
      }
    }

    // 7. Resolver processing_profile_code
    //    Prioridad: 1) explícito en request, 2) channelProfileMapper del servicio, 3) 'standard'
    let profileCode = mediaRequest.processing_profile_code || null;
    if (!profileCode || profileCode === 'standard') {
      const channelProfileMapper = serviceRegistry.getChannelProfileMapper(mediaRequest.source_app);
      if (channelProfileMapper && typeof channelProfileMapper.resolveProfile === 'function') {
        profileCode = channelProfileMapper.resolveProfile({
          channel: mediaRequest.external_context_id || null,
          mediaType: mediaRequest.media_type,
          orientation,
          targetContext: mediaRequest.target_context,
        }) || 'standard';
      } else {
        profileCode = 'standard';
      }
    }

    // 8. Determinar ruta del watermark según el perfil resuelto
    const watermarkPath = applyWatermark && watermarkProfileCode
      ? await _getWatermarkPathForProfile(watermarkProfileCode)
      : null;

    let result;
    if (mediaRequest.media_type === 'image') {
      result = await mediaProcessor.processImage(rawPath, mediaId, {
        applyWatermark, watermarkPath, processingProfileCode: profileCode,
      });
    } else if (mediaRequest.media_type === 'video') {
      result = await mediaProcessor.processVideo(rawPath, mediaId, {
        applyWatermark, watermarkPath, processingProfileCode: profileCode,
      });
    } else {
      throw new Error(`Tipo de media no soportado: ${mediaRequest.media_type}`);
    }

    // Propagar orientación detectada
    if (!result.orientation && orientation) {
      result.orientation = orientation;
    }

    // 9. Actualizar metadata del original (dimensiones, sha256)
    await originalService.registerOriginal({
      mediaId,
      originalStoragePath: original.original_storage_path,
      originalUrl: original.original_url,
      mimeType: original.mime_type,
      extension: original.extension,
      sizeBytes: original.size_bytes,
      width: result.width,
      height: result.height,
      durationMs: result.durationMs || null,
      orientation: result.orientation,
      sha256Hash: result.sha256,
    });

    // 10. Registrar cada variante
    for (const variant of result.variants) {
      await variantService.upsertVariant(variant);
    }

    // 11. Marcar como ready
    const readyResult = await variantService.markReady(mediaId, jobId);
    console.log(`[processingWorker] Ready media_id=${mediaId}`);

    // 12. Limpiar archivo original
    _deleteRaw(rawPath);

  } catch (err) {
    console.error(`[processingWorker] Error job_id=${jobId}:`, err.message);
    try {
      await variantService.markFailed(mediaId, 'PROCESSING_ERROR', err.message, jobId);
    } catch (dbErr) {
      console.error('[processingWorker] Error al marcar failed en DB:', dbErr.message);
    }
  }
}

async function _getOriginalRecord(mediaId) {
  const { getPool, sql } = require('../../db');
  const pool = await getPool();
  const result = await pool.request()
    .input('mediaId', sql.UniqueIdentifier, mediaId)
    .query('SELECT * FROM me.media_original WHERE media_id = @mediaId');
  return result.recordset[0] || null;
}

async function _getWatermarkPathForProfile(profileCode) {
  // Si el perfil es 'antojados_default', usar la imagen bitmap.png del engine
  if (profileCode === 'antojados_default') {
    const defaultPath = require('path').join(__dirname, '..', '..', 'assets', 'watermark', 'bitmap.png');
    if (require('fs').existsSync(defaultPath)) return defaultPath;
    console.warn('[processingWorker] Watermark bitmap.png no encontrado en:', defaultPath);
    return null;
  }

  // Otros perfiles: consultar en DB
  try {
    const { getPool, sql } = require('../../db');
    const pool = await getPool();
    const result = await pool.request()
      .input('code', sql.NVarChar(60), profileCode)
      .query('SELECT logo_storage_path FROM me.watermark_profile WHERE watermark_profile_code = @code AND is_active = 1');
    const profile = result.recordset[0];
    return profile?.logo_storage_path || null;
  } catch (err) {
    console.warn(`[processingWorker] Error al obtener watermark path para perfil ${profileCode}:`, err.message);
    return null;
  }
}

function _deleteRaw(rawPath) {
  try {
    if (rawPath && require('fs').existsSync(rawPath)) {
      require('fs').unlinkSync(rawPath);
    }
  } catch (e) {
    console.warn('[processingWorker] No se pudo borrar raw:', rawPath, e.message);
  }
}

function _detectOrientation(width, height) {
  if (!width || !height) return 'square';
  if (width > height) return 'landscape';
  if (width < height) return 'portrait';
  return 'square';
}

module.exports = { start, stop };
