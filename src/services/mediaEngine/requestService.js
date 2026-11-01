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
 * @param {string} params.sourceApp          — android, ios, web, admin, worker
 * @param {string} params.sourceActorType    — user, sponsor, employee, admin, system
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
    .input('channel', sql.NVarChar(40), params.channel || null)
    .input('post_id', sql.NVarChar(80), params.post_id || null)
    .input('sponsor_id', sql.NVarChar(80), params.sponsor_id || null)
    .input('user_id', sql.NVarChar(80), params.user_id || null)
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

/**
 * Enumera el material de un actor del motor — el acto que hace posible que
 * exista una biblioteca de media en la UI.
 *
 * Sin este listado el cliente sólo puede subir desde el equipo: no hay forma de
 * reutilizar un asset que ya vive en el Engine.
 *
 * @param {object} params
 * @param {string} params.sourceActorId   — obligatorio; el SP falla cerrado sin él
 * @param {string} [params.sourceApp]
 * @param {string} [params.mediaType]     — image, video, audio
 * @param {string} [params.status]
 * @param {string} [params.search]
 * @param {number} [params.limit]
 * @param {number} [params.offset]
 */
async function listByActor(params = {}) {
  const pool = await getPool();
  const result = await pool.request()
    .input('source_actor_id', sql.NVarChar(120), params.sourceActorId)
    .input('source_app', sql.NVarChar(30), params.sourceApp || null)
    .input('media_type', sql.NVarChar(20), params.mediaType || null)
    .input('status', sql.NVarChar(30), params.status || null)
    .input('search', sql.NVarChar(160), params.search || null)
    .input('limit', sql.Int, params.limit || 60)
    .input('offset', sql.Int, params.offset || 0)
    .execute('me.sp_media_list_by_actor');

  return result.recordset || [];
}

module.exports = { createRequest, getById, cancel, listByActor };
