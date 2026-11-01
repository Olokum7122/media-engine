'use strict';

/**
 * actorGuardService.js — Contención de concurrencia por actor y reaper de cola.
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMINIO:      Media Engine — Anti-saturación de la cola de procesamiento
 * RESPONSABLE:  Decidir si un actor puede abrir otra petición de media, y
 *               reclamar el trabajo que quedó huérfano en la cola.
 *
 * NO HACE:
 *   - No crea peticiones (lo hace requestService.createRequest).
 *   - No procesa media (lo hace mediaProcessorV3 vía processingWorker).
 *   - No impone cuota por volumen ni por bytes: sólo exclusión de una
 *     publicación en vuelo por actor.
 *
 * POR QUÉ EXISTE:
 *   El worker es un solo proceso secuencial. Cada video paga 3-4 transcodes
 *   completos; si el mismo usuario encola cinco videos seguidos, el quinto
 *   espera detrás de doce transcodes sin techo ni aviso. La contención en la
 *   puerta de entrada es la única medida que no cambia la calidad de salida.
 *
 * SPs utilizados:
 *   me.sp_media_actor_busy
 *   me.sp_media_job_reap_stale
 */

const { getPool, sql } = require('../../db');
const config = require('../../config');

/**
 * Marcadores con los que los clientes sustituyen la identidad cuando no la
 * tienen. NO identifican a nadie: todos los usuarios que los envían comparten
 * el mismo valor. Contener por ellos es contener a la población entera, que es
 * exactamente el defecto que dejó a los testers sin poder publicar.
 */
const ACTORES_MARCADOR = new Set([
  'unknown', 'anon', 'anonymous', 'null', 'undefined', 'undefined_user', '',
]);

function esActorMarcador(sourceActorId) {
  if (sourceActorId === null || sourceActorId === undefined) return true;
  return ACTORES_MARCADOR.has(String(sourceActorId).trim().toLowerCase());
}

/**
 * Estado de concurrencia de un actor.
 *
 * @param {object} params
 * @param {string} params.sourceActorId — id REAL de sesión. Un marcador
 *   compartido (`unknown`, `anon`, vacío) no se contiene: no hay a quién.
 * @param {string} [params.sourceApp]
 * @param {string} [params.excludeClientReferenceId] — permite reintentar la MISMA publicación
 * @returns {Promise<{busy:boolean, activeCount:number, mediaId:string|null, mediaType:string|null, status:string|null, targetContext:string|null, elapsedSeconds:number, busyReason:string|null, identityMissing:boolean}>}
 */
async function getActorBusy(params = {}) {
  if (esActorMarcador(params.sourceActorId)) {
    // Se devuelve libre y con la marca de identidad ausente. El motor no puede
    // decidir por un actor que no existe; el defecto es del llamador, no de
    // quien publica, y debe verse en la respuesta en lugar de silenciarse.
    return {
      busy: false, activeCount: 0, mediaId: null, mediaType: null, status: null,
      targetContext: null, elapsedSeconds: 0, busyReason: null, identityMissing: true,
    };
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('source_actor_id', sql.NVarChar(120), params.sourceActorId)
    .input('source_app', sql.NVarChar(30), params.sourceApp || null)
    .input('stale_received_minutes', sql.Int, config.guard.staleReceivedMinutes)
    .input('exclude_client_reference_id', sql.NVarChar(160), params.excludeClientReferenceId || null)
    .input('exclude_client_reference_prefix', sql.NVarChar(120), params.excludeClientReferencePrefix || null)
    .execute('me.sp_media_actor_busy');

  const row = result.recordset && result.recordset[0];
  if (!row) {
    return {
      busy: false, activeCount: 0, mediaId: null, mediaType: null, status: null,
      targetContext: null, elapsedSeconds: 0, busyReason: null, identityMissing: false,
    };
  }

  return {
    busy: row.busy === true || row.busy === 1,
    activeCount: row.active_count || 0,
    mediaId: row.media_id || null,
    mediaType: row.media_type || null,
    status: row.status || null,
    targetContext: row.target_context || null,
    elapsedSeconds: row.elapsed_seconds || 0,
    busyReason: row.busy_reason || null,
    identityMissing: row.identity_missing === true || row.identity_missing === 1,
  };
}

/**
 * Reclama trabajo huérfano: jobs `running` que superaron el horizonte, peticiones
 * en `processing` sin job vivo, y peticiones que nunca recibieron bytes.
 *
 * @returns {Promise<{jobsRequeued:number, requestsFailed:number, requestsExpired:number}>}
 */
async function reapStale() {
  const pool = await getPool();
  const result = await pool.request()
    .input('stale_minutes', sql.Int, config.worker.staleJobMinutes)
    .input('abandon_minutes', sql.Int, config.worker.uploadAbandonMinutes)
    .execute('me.sp_media_job_reap_stale');

  const row = result.recordset && result.recordset[0];
  return {
    jobsRequeued: row?.jobs_requeued || 0,
    requestsFailed: row?.requests_failed || 0,
    requestsExpired: row?.requests_expired || 0,
  };
}

/**
 * Renueva el lease de un job en vuelo.
 *
 * El reaper declara huérfano un job `running` cuyo `locked_at` superó el
 * horizonte. Sin este latido, `locked_at` sólo se escribía al reservar, de modo
 * que un transcode legítimo más largo que el horizonte se devolvía a la cola
 * creyéndolo muerto. `renewed = 0` significa que el job ya no es de este worker:
 * o el reaper lo reclamó, o alguien lo cerró.
 *
 * @returns {Promise<{renewed:boolean, status:string|null}>}
 */
async function heartbeat(jobId, workerId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('job_id', sql.BigInt, jobId)
    .input('worker_id', sql.NVarChar(120), workerId || config.workerId)
    .execute('me.sp_media_job_heartbeat');

  const row = result.recordset && result.recordset[0];
  return {
    renewed: Number(row?.renewed || 0) > 0,
    status: row?.status || null,
  };
}

/**
 * Respuesta 409 normalizada para el cliente: dice QUÉ está en proceso y cuándo
 * reintentar, que es lo que convierte un bloqueo en un mensaje comprensible.
 *
 * El motivo se nombra según el estado real: una subida en vuelo no es lo mismo
 * que un procesamiento, y decirle «se está procesando» a quien sólo dejó una
 * subida a medias es lo que hacía incomprensible el 409 anterior. El tipo de
 * media se toma del intake bloqueante, que es el que de verdad está en curso.
 */
function buildBusyResponse(busy) {
  const segundos = Number(busy.elapsedSeconds || 0);
  const sustantivo = { video: 'video', image: 'imagen', audio: 'audio' }[busy.mediaType] || 'archivo';

  const mensajes = {
    upload_in_flight: `Tu ${sustantivo} anterior todavía se está subiendo. Espera a que termine antes de publicar otra cosa.`,
    awaiting_processing: `Tu ${sustantivo} anterior terminó de subir y está en cola de procesamiento. Espera a que esté listo antes de publicar otra cosa.`,
    processing: `Tu ${sustantivo} anterior todavía se está procesando. Espera a que termine antes de publicar otra cosa.`,
  };
  const message = mensajes[busy.busyReason] || mensajes.processing;

  return {
    error: 'Ya tienes una publicación en curso',
    code: 'ACTOR_BUSY',
    message,
    detail: {
      mediaId: busy.mediaId,
      mediaType: busy.mediaType,
      status: busy.status,
      targetContext: busy.targetContext,
      elapsedSeconds: segundos,
      activeCount: busy.activeCount,
      reason: busy.busyReason || 'processing',
    },
    retryAfterSeconds: config.guard.retryAfterSeconds,
  };
}

module.exports = { getActorBusy, reapStale, heartbeat, buildBusyResponse, esActorMarcador };
