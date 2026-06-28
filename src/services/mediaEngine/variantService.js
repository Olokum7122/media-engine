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

async function pickNextJob(jobType = null) {
  const pool = await getPool();
  const result = await pool.request()
    .input('worker_id', sql.NVarChar(120), config.workerId)
    .input('job_type', sql.NVarChar(40), jobType || null)
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

module.exports = {
  upsertVariant,
  markReady,
  markFailed,
  markRejected,
  pickNextJob,
  markJobRunning,
};
