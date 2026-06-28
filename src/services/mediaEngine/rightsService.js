'use strict';

/**
 * rightsService.js — Capa de acceso a SPs de derechos y origen.
 *
 * SPs utilizados:
 *   me.sp_media_rights_origin_upsert
 *   me.sp_media_rights_origin_get
 *   me.sp_media_rights_policy_evaluate
 */

const { getPool, sql } = require('../../db');

/**
 * Registra o actualiza los derechos y origen de un media.
 *
 * @param {object} params
 * @param {string} params.mediaId
 * @param {string} params.originType              — official_antojados, explorer_partner, etc.
 * @param {string} [params.originPlatform]        — antojados, tiktok, instagram, facebook, youtube, etc.
 * @param {string} [params.originUrl]
 * @param {string} [params.originalAuthorName]
 * @param {string} [params.originalAuthorHandle]
 * @param {boolean} [params.originalWatermarkDetected]
 * @param {string} [params.engineWatermarkPolicy] — apply, skip, preserve_external, admin_review, blocked
 * @param {string} [params.ownershipType]         — company_owned, licensed_to_company, etc.
 * @param {boolean} [params.employmentGenerated]
 * @param {string} [params.licenseScope]
 * @param {string} [params.rightsDeclaration]
 * @param {string} [params.rightsStatus]          — pending, declared, approved, restricted, etc.
 * @param {string} [params.licenseType]
 * @param {boolean} [params.isDemoContent]
 * @param {string} [params.demoDisclaimer]
 * @param {boolean} [params.allowPublicDisplay]
 * @param {boolean} [params.allowDownload]
 * @param {boolean} [params.allowShare]
 * @param {boolean} [params.allowRemix]
 * @param {boolean} [params.allowEngineWatermark]
 */
async function upsertRightsOrigin(params) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, params.mediaId)
    .input('origin_type', sql.NVarChar(40), params.originType)
    .input('origin_platform', sql.NVarChar(40), params.originPlatform || 'antojados')
    .input('origin_url', sql.NVarChar(1200), params.originUrl || null)
    .input('original_author_name', sql.NVarChar(160), params.originalAuthorName || null)
    .input('original_author_handle', sql.NVarChar(160), params.originalAuthorHandle || null)
    .input('original_watermark_detected', sql.Bit, params.originalWatermarkDetected ? 1 : 0)
    .input('engine_watermark_policy', sql.NVarChar(40), params.engineWatermarkPolicy || 'skip')
    .input('ownership_type', sql.NVarChar(40), params.ownershipType || 'unknown')
    .input('employment_generated', sql.Bit, params.employmentGenerated ? 1 : 0)
    .input('license_scope', sql.NVarChar(80), params.licenseScope || 'unknown')
    .input('rights_declaration', sql.NVarChar(60), params.rightsDeclaration || 'declared')
    .input('rights_status', sql.NVarChar(40), params.rightsStatus || 'pending')
    .input('license_type', sql.NVarChar(60), params.licenseType || 'unknown')
    .input('is_demo_content', sql.Bit, params.isDemoContent ? 1 : 0)
    .input('demo_disclaimer', sql.NVarChar(500), params.demoDisclaimer || null)
    .input('allow_public_display', sql.Bit, params.allowPublicDisplay !== false ? 1 : 0)
    .input('allow_download', sql.Bit, params.allowDownload ? 1 : 0)
    .input('allow_share', sql.Bit, params.allowShare !== false ? 1 : 0)
    .input('allow_remix', sql.Bit, params.allowRemix ? 1 : 0)
    .input('allow_engine_watermark', sql.Bit, params.allowEngineWatermark ? 1 : 0)
    .execute('me.sp_media_rights_origin_upsert');

  return result.recordset[0] || null;
}

/**
 * Obtiene los derechos y origen de un media.
 *
 * @param {string} mediaId
 */
async function getRightsOrigin(mediaId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, mediaId)
    .execute('me.sp_media_rights_origin_get');

  return result.recordset[0] || null;
}

/**
 * Evalúa la política de derechos para un media.
 *
 * @param {string} mediaId
 * @returns {Promise<object>} — { can_process, can_publish, can_download, can_share, ... }
 */
async function evaluatePolicy(mediaId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, mediaId)
    .execute('me.sp_media_rights_policy_evaluate');

  return result.recordset[0] || null;
}

module.exports = { upsertRightsOrigin, getRightsOrigin, evaluatePolicy };
