'use strict';

/**
 * variantService.js — Upsert de variantes y marcado de ready/failed.
 *
 * SPs utilizados:
 *   me.sp_media_variant_upsert
 *   me.sp_media_mark_ready
 *   me.sp_media_mark_failed
 *   me.sp_media_mark_rejected
 *   me.sp_media_job_pick_next
 *   me.sp_media_job_mark_running
 */

const { getPool, sql } = require('../../db');
const config = require('../../config');

/**
 * Registra o actualiza una variante procesada.
 *
 * @param {object} params
 * @param {string} params.mediaId
 * @param {string} params.variantCode        — thumb, grid, feed, full, story, cover, avatar, short, feed_video, video_preview
 * @param {string} params.mediaType          — image, video
 * @param {string} params.url                — URL pública de la variante
 * @param {string} [params.storagePath]
 * @param {string} params.mimeType
 * @param {number} [params.width]
 * @param {number} [params.height]
 * @param {number} [params.durationMs]
 * @param {number} [params.sizeBytes]
 * @param {string} [params.aspectRatio]
 * @param {string} [params.codec]
 * @param {number} [params.bitrateKbps]
 * @param {number} [params.fps]
 * @param {boolean} [params.hasWatermark]
 * @param {boolean} [params.isDefault]
 * @param {boolean} [params.isPublic]
 * @param {string} [params.processingProfileCode]
 * @param {number} [params.profileVersion]
 */
async function upsertVariant(params) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, params.mediaId)
    .input('variant_code', sql.NVarChar(40), params.variantCode)
    .input('media_type', sql.NVarChar(20), params.mediaType)
    .input('url', sql.NVarChar(1200), params.url)
    .input('storage_path', sql.NVarChar(1200), params.storagePath || null)
    .input('mime_type', sql.NVarChar(120), params.mimeType)
    .input('width', sql.Int, params.width || null)
    .input('height', sql.Int, params.height || null)
    .input('duration_ms', sql.Int, params.durationMs || null)
    .input('size_bytes', sql.BigInt, params.sizeBytes || null)
    .input('aspect_ratio', sql.NVarChar(20), params.aspectRatio || null)
    .input('codec', sql.NVarChar(80), params.codec || null)
    .input('bitrate_kbps', sql.Int, params.bitrateKbps || null)
    .input('fps', sql.Decimal(5, 2), params.fps || null)
    .input('has_watermark', sql.Bit, params.hasWatermark ? 1 : 0)
    .input('is_default', sql.Bit, params.isDefault !== false ? 1 : 0)
    .input('is_public', sql.Bit, params.isPublic !== false ? 1 : 0)
    .input('processing_profile_code', sql.NVarChar(60), params.processingProfileCode || 'standard')
    .input('profile_version', sql.Int, params.profileVersion || 1)
    .execute('me.sp_media_variant_upsert');

  return result.recordset[0] || null;
}

/**
 * Marca un media como ready (construye el payload automáticamente).
 *
 * @param {string} mediaId
 * @param {string} [jobId]  — opcional, para auditoría
 */
async function markReady(mediaId, jobId = null) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, mediaId)
    .input('job_id', sql.BigInt, jobId || null)
    .execute('me.sp_media_mark_ready');

  return result.recordset[0] || null;
}

/**
 * Marca un media como failed.
 *
 * @param {string} mediaId
 * @param {string} errorCode
 * @param {string} errorMessage
 * @param {string} [jobId]
 */
async function markFailed(mediaId, errorCode, errorMessage, jobId = null) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, mediaId)
    .input('error_code', sql.NVarChar(80), errorCode)
    .input('error_message', sql.NVarChar(2000), errorMessage)
    .input('job_id', sql.BigInt, jobId || null)
    .execute('me.sp_media_mark_failed');

  return result.rowsAffected[0] > 0;
}

/**
 * Rechaza un media.
 *
 * @param {string} mediaId
 * @param {string} reason
 * @param {string} [jobId]
 */
async function markRejected(mediaId, reason, jobId = null) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, mediaId)
    .input('rejection_reason', sql.NVarChar(500), reason)
    .input('job_id', sql.BigInt, jobId || null)
    .execute('me.sp_media_mark_rejected');

  return result.rowsAffected[0] > 0;
}

/**
 * Reserva atómicamente el siguiente job elegible.
 *
 * Acepta dos formas por compatibilidad:
 *   pickNextJob('full_pipeline')                     ← firma histórica
 *   pickNextJob({ mediaType: 'audio' })              ← filtro por tipo de media
 *
 * `mediaType` / `excludeMediaType` existen para que el worker pueda mantener un
 * carril rápido de audio: el audio se resuelve con un `ffprobe` y sin
 * transcodificar, así que no debe esperar detrás de una transcodificación de
 * vídeo en una cola FIFO. El filtro se aplica DENTRO del mismo SELECT ... TOP 1
 * con UPDLOCK: no hay dos colas, ni dos workers, ni una tabla nueva.
 *
 * @param {string|{jobType?:string, mediaType?:string, excludeMediaType?:string}} [opciones]
 * @returns {Promise<object|null>}
 */
async function pickNextJob(opciones = null) {
  const opts = typeof opciones === 'string' ? { jobType: opciones } : (opciones || {});
  const pool = await getPool();
  const result = await pool.request()
    .input('worker_id', sql.NVarChar(120), config.workerId)
    .input('job_type', sql.NVarChar(40), opts.jobType || null)
    .input('media_type', sql.NVarChar(20), opts.mediaType || null)
    .input('exclude_media_type', sql.NVarChar(20), opts.excludeMediaType || null)
    .execute('me.sp_media_job_pick_next');

  return result.recordset[0] || null;
}

/**
 * Marca un job como running.
 *
 * @param {number} jobId
 */
async function markJobRunning(jobId) {
  const pool = await getPool();
  await pool.request()
    .input('job_id', sql.BigInt, jobId)
    .input('worker_id', sql.NVarChar(120), config.workerId)
    .execute('me.sp_media_job_mark_running');
}

/**
 * Cierra un job fallido con la política de reintento del motor.
 *
 * Es la sustitución de `markFailed` en el camino del worker: aquél cerraba job
 * y request en `failed` para siempre, de modo que un timeout indistinguible de
 * un códec no soportado obligaba al usuario a volver a subir el archivo. Aquí
 * el SP decide: reintento con backoff (request vuelve a `queued`), fallo
 * permanente (`failed`) o agotamiento (`dead_letter`).
 *
 * @param {object} params
 * @param {string} params.mediaId
 * @param {number} params.jobId
 * @param {string} params.errorCode
 * @param {string} [params.errorMessage]
 * @param {boolean} [params.retryable=true]
 */
async function retryOrFail(params) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, params.mediaId)
    .input('job_id', sql.BigInt, params.jobId)
    .input('error_code', sql.NVarChar(80), params.errorCode)
    .input('error_message', sql.NVarChar(2000), params.errorMessage || null)
    .input('retryable', sql.Bit, params.retryable === false ? 0 : 1)
    .input('base_delay_seconds', sql.Int, config.worker.retryBaseDelaySeconds)
    .input('max_delay_seconds', sql.Int, config.worker.retryMaxDelaySeconds)
    .execute('me.sp_media_job_retry_or_fail');

  return result.recordset[0] || null;
}

/**
 * Métricas de cola: profundidad, aplazados, en vuelo por worker, dead-letter.
 *
 * @returns {Promise<{totals: object, inFlight: object[], deadLetter: object[], retriesLastHour: number}>}
 */
async function queueStats() {
  const pool = await getPool();
  const result = await pool.request().execute('me.sp_media_queue_stats');
  const sets = result.recordsets || [];

  return {
    totals: (sets[0] && sets[0][0]) || {},
    inFlight: sets[1] || [],
    deadLetter: sets[2] || [],
    retriesLastHour: (sets[3] && sets[3][0] && sets[3][0].retries_last_hour) || 0,
  };
}

/**
 * Retención de jobs terminados (migración 24).
 *
 * Sin esto `me.processing_job` crece sin techo: al 2026-11-01 había 116.109
 * filas, 115.979 de ellas terminadas. Un ciclo por lote acota el costo; el
 * llamador decide la cadencia.
 *
 * @param {number} olderThanDays — antigüedad mínima de un job terminado
 * @param {number} batchSize     — filas por lote
 * @returns {Promise<{deleted: number, older_than_days: number}>}
 */
async function purgeTerminatedJobs(olderThanDays, batchSize) {
  const pool = await getPool();
  const result = await pool.request()
    .input('older_than_days', sql.Int, olderThanDays)
    .input('batch_size', sql.Int, batchSize)
    .execute('me.sp_media_job_purge_terminated');

  const row = (result.recordset && result.recordset[0]) || {};
  return { deleted: row.deleted || 0, older_than_days: row.older_than_days || olderThanDays };
}

module.exports = {
  upsertVariant,
  markReady,
  markFailed,
  markRejected,
  pickNextJob,
  markJobRunning,
  retryOrFail,
  queueStats,
  purgeTerminatedJobs,
};
