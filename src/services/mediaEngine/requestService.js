'use strict';

/**
 * requestService.js — Capa de acceso a SPs de media_request.
 *
 * SPs utilizados:
 *   me.sp_media_request_create
 *   me.sp_media_get_by_id
 *   me.sp_media_cancel
 */

const { getPool, sql } = require('../../db');

/**
 * Crea una solicitud de media.
 *
 * @param {object} params
 * @param {string} params.sourceApp          — android, ios, explorer, web, admin, worker
 * @param {string} params.sourceActorType    — user, sponsor, explorer, employee, admin, system
 * @param {string} params.sourceActorId      — ID del actor (user_id, sponsor_id, etc.)
 * @param {string} params.targetContext      — post, short, pachanga, profile, sponsor, etc.
 * @param {string} params.mediaType          — image, video
 * @param {string} [params.externalContextId]
 * @param {string} [params.externalTraceId]
 * @param {string} [params.clientReferenceId]
 * @param {string} [params.processingProfileCode]  — default 'standard'
 * @param {string} [params.watermarkProfileCode]
 */
async function createRequest(params) {
  const pool = await getPool();
  const result = await pool.request()
    .input('source_app', sql.NVarChar(30), params.sourceApp)
    .input('source_actor_type', sql.NVarChar(30), params.sourceActorType)
    .input('source_actor_id', sql.NVarChar(120), params.sourceActorId)
    .input('target_context', sql.NVarChar(40), params.targetContext)
    .input('media_type', sql.NVarChar(20), params.mediaType)
    .input('external_context_id', sql.NVarChar(160), params.externalContextId || null)
    .input('external_trace_id', sql.NVarChar(160), params.externalTraceId || null)
    .input('client_reference_id', sql.NVarChar(160), params.clientReferenceId || null)
    .input('processing_profile_code', sql.NVarChar(60), params.processingProfileCode || 'standard')
    .input('watermark_profile_code', sql.NVarChar(60), params.watermarkProfileCode || null)
    .execute('me.sp_media_request_create');

  const output = result.recordset[0];
  if (!output) {
    throw new Error('createRequest: no se obtuvo respuesta del SP');
  }
  return output;
}

/**
 * Obtiene un media request por su media_id.
 *
 * @param {string} mediaId  — UUID del media request
 */
async function getById(mediaId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, mediaId)
    .execute('me.sp_media_get_by_id');

  return result.recordset[0] || null;
}

/**
 * Cancela un media request pendiente.
 *
 * @param {string} mediaId
 * @param {string} [reason]
 */
async function cancel(mediaId, reason = null) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, mediaId)
    .input('rejection_reason', sql.NVarChar(500), reason || null)
    .execute('me.sp_media_cancel');

  return result.rowsAffected[0] > 0;
}

module.exports = { createRequest, getById, cancel };
