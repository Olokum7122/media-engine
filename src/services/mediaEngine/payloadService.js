'use strict';

/**
 * payloadService.js — Servicio para obtener ready payloads.
 *
 * SPs utilizados:
 *   me.sp_media_get_ready_payload
 *
 * Vista:
 *   me.v_media_ready_payload
 */

const { getPool, sql } = require('../../db');

/**
 * Obtiene el ready payload de un media (solo si está en estado 'ready').
 *
 * @param {string} mediaId
 * @returns {Promise<object|null>} Payload con URLs de variantes, o null si no está ready.
 */
async function getReadyPayload(mediaId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, mediaId)
    .execute('me.sp_media_get_ready_payload');

  const row = result.recordset[0];
  if (!row) return null;

  return {
    mediaId: row.media_id,
    status: row.status,
    ready: row.status === 'ready',
    payload: row.status === 'ready' ? {
      thumbUrl: row.thumb_url,
      gridUrl: row.grid_url,
      feedUrl: row.feed_url,
      fullUrl: row.full_url,
      coverUrl: row.cover_url,
      storyUrl: row.story_url,
      avatarUrl: row.avatar_url,
      videoUrl: row.video_url,
      videoPreviewUrl: row.video_preview_url,
      durationMs: row.duration_ms,
      width: row.width,
      height: row.height,
      aspectRatio: row.aspect_ratio,
      originType: row.origin_type,
      originPlatform: row.origin_platform,
      ownershipType: row.ownership_type,
      rightsStatus: row.rights_status,
      licenseType: row.license_type,
      isDemoContent: row.is_demo_content,
      demoDisclaimer: row.demo_disclaimer,
      allowDownload: row.allow_download,
      allowShare: row.allow_share,
      payloadVersion: row.payload_version,
      readyAt: row.ready_at,
    } : null,
  };
}

/**
 * Obtiene el payload desde la vista v_media_ready_payload (lectura directa).
 *
 * @param {string} mediaId
 */
async function getReadyPayloadFromView(mediaId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('mediaId', sql.UniqueIdentifier, mediaId)
    .query('SELECT * FROM me.v_media_ready_payload WHERE media_id = @mediaId');

  return result.recordset[0] || null;
}

module.exports = { getReadyPayload, getReadyPayloadFromView };
