'use strict';

/**
 * processingWorker.js — Worker de procesamiento background V3.
 *
 * Pipeline:
 *   pick_next_job → mark_running → evaluate_policy →
 *   extract_metadata → generate_variants → upsert_variants →
 *   mark_ready (o mark_failed / mark_rejected)
 */

const config = require('../../config');
const variantService = require('./variantService');
const requestService = require('./requestService');
const rightsService = require('./rightsService');
const policyEvaluator = require('./policyEvaluator');
const mediaProcessor = require('./mediaProcessorV3');
const originalService = require('./originalService');

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

    // 3. Evaluar política de derechos
    const policy = await policyEvaluator.evaluate(mediaId);
    if (!policy.canProcess) {
      await variantService.markRejected(mediaId, policy.policyReason || 'Política de derechos denegada', jobId);
      console.log(`[processingWorker] Rechazado media_id=${mediaId}: ${policy.policyReason}`);
      return;
    }

    // 4. Obtener datos del original
    const rights = await rightsService.getRightsOrigin(mediaId);
    const applyWatermark = policy.shouldApplyEngineWatermark &&
      rights?.allow_engine_watermark;

    // 5. Determinar ruta del archivo original
    const original = await _getOriginalRecord(mediaId);
    if (!original || !original.original_storage_path) {
      throw new Error(`Original no registrado para media_id=${mediaId}`);
    }

    const rawPath = original.original_storage_path;
    if (!require('fs').existsSync(rawPath)) {
      throw new Error(`Archivo original no encontrado: ${rawPath}`);
    }

    // 6. Procesar según tipo de media
    const watermarkPath = applyWatermark ? await _getWatermarkPath(rights) : null;

    let result;
    if (mediaRequest.media_type === 'image') {
      result = await mediaProcessor.processImage(rawPath, mediaId, { applyWatermark, watermarkPath });
    } else if (mediaRequest.media_type === 'video') {
      result = await mediaProcessor.processVideo(rawPath, mediaId, { applyWatermark, watermarkPath });
    } else {
      throw new Error(`Tipo de media no soportado: ${mediaRequest.media_type}`);
    }

    // 7. Actualizar metadata del original (dimensiones, sha256)
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

    // 8. Registrar cada variante
    for (const variant of result.variants) {
      await variantService.upsertVariant(variant);
    }

    // 9. Marcar como ready
    const readyResult = await variantService.markReady(mediaId, jobId);
    console.log(`[processingWorker] Ready media_id=${mediaId}`);

    // 10. Limpiar archivo original
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

async function _getWatermarkPath(rights) {
  if (!rights?.watermark_profile_code) return null;
  const { getPool, sql } = require('../../db');
  const pool = await getPool();
  const result = await pool.request()
    .input('code', sql.NVarChar(60), rights.watermark_profile_code)
    .query('SELECT logo_storage_path FROM me.watermark_profile WHERE watermark_profile_code = @code AND is_active = 1');
  const profile = result.recordset[0];
  return profile?.logo_storage_path || null;
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

module.exports = { start, stop };
