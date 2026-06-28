'use strict';
/**
 * mediaIntakeWorker.js — Worker de procesamiento de media en background.
 *
 * Ciclo: cada POLL_INTERVAL_MS sondea soc_media_intake buscando filas 'pending'.
 * Por cada fila:
 *   1. Marca status='processing'
 *   2. Procesa con mediaProcessor (sharp/ffmpeg)
 *   3. INSERT en soc_media_assets con las variantes
 *   4. Llama mediaChannelRouter para actualizar la entidad destino
 *   5. Marca status='done', borra raw file
 *   6. En caso de error: marca status='error' + error_msg, conserva raw file
 *
 * Sólo corre en el proceso principal del servidor (index.js lo arranca).
 * No hay multi-proceso: SQL Server garantiza que sólo una fila en 'processing'
 * no será re-procesada (la query filtra status='pending').
 */

const pathMod      = require('path');
const fs           = require('fs');
const { getPool, sql } = require('../../db');
const { randomUUID }   = require('crypto');
const processor    = require('./mediaProcessor');
const router       = require('./mediaChannelRouter');

const POLL_INTERVAL_MS = 15_000;  // 15 segundos
const MAX_BATCH        = 3;       // máximo de ítems procesados por ciclo

let _timer = null;

// ─── API pública ──────────────────────────────────────────────────────────────

function start() {
  if (_timer) return; // idempotente
  console.log('[mediaWorker] iniciado, polling cada', POLL_INTERVAL_MS / 1000, 's');
  _timer = setInterval(_cycle, POLL_INTERVAL_MS);
  _cycle(); // primer ciclo inmediato al arrancar
}

function stop() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    console.log('[mediaWorker] detenido');
  }
}

// ─── Ciclo de procesamiento ───────────────────────────────────────────────────

async function _cycle() {
  let rows;
  try {
    rows = await _fetchPending();
  } catch (e) {
    console.error('[mediaWorker] error fetching pending:', e.message);
    return;
  }

  for (const row of rows) {
    await _processRow(row);
  }
}

async function _fetchPending() {
  const pool = getPool('antojados');
  // También recupera intakes huérfanos: status='processing' por >5 minutos
  // (causado por restart del proceso mientras estaba transcoding)
  const result = await pool.request()
    .input('limit', sql.Int, MAX_BATCH)
    .query(`
      SELECT TOP (@limit)
        intake_id, channel, entity_id, entity_context,
        raw_path, media_type, mime_type, size_bytes
      FROM antojados_core.soc_media_intake
      WHERE status = 'pending'
         OR (status = 'processing' AND processed_at < DATEADD(MINUTE, -5, GETUTCDATE()))
      ORDER BY created_at ASC
    `);
  return result.recordset;
}

async function _processRow(row) {
  const { intake_id, channel, entity_id, entity_context, raw_path, media_type, mime_type, size_bytes } = row;

  try {
    // 1. Marcar en proceso
    await _setStatus(intake_id, 'processing');

    // 2. Verificar que el archivo crudo existe
    if (!fs.existsSync(raw_path)) {
      throw new Error(`raw_path no encontrado en disco: ${raw_path}`);
    }

    const uploadsDir = pathMod.dirname(raw_path);
    const baseUrl    = String(process.env.API_BASE_URL || '').trim().replace(/\/+$/, '');

    // 3. Procesar variantes
    console.log(`[mediaWorker] procesando intake_id=${intake_id} tipo=${media_type} size=${size_bytes}`);
    let variants;
    if (media_type === 'photo') {
      variants = await processor.processImage(raw_path, uploadsDir, baseUrl);
    } else {
      // Timeout de 5 minutos para video (evita colgarse indefinidamente)
      const videoPromise = processor.processVideo(raw_path, uploadsDir, baseUrl);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('ffmpeg timeout (5 min)')), 5 * 60 * 1000)
      );
      variants = await Promise.race([videoPromise, timeoutPromise]);
    }
    console.log(`[mediaWorker] variantes generadas intake_id=${intake_id}`);

    // 4. Guardar asset técnico en la tabla del dominio correspondiente
    const assetId = randomUUID();
    await _insertAsset({
      assetId, intakeId: intake_id, channel, entityId: entity_id,
      mediaType: media_type, mimeType: mime_type, sizeBytes: size_bytes,
      remoteUrl: variants.feed_url || variants.thumb_url,
      variants,
    });

    // 5. Routing a entidad destino
    await router.routeToEntity(channel, entity_id, entity_context, media_type, variants, assetId);

    // 6. Completar: borrar raw + marcar done
    _deleteRaw(raw_path);
    await _setStatus(intake_id, 'done');

    console.log(`[mediaWorker] OK intake_id=${intake_id} channel=${channel}`);

  } catch (e) {
    console.error(`[mediaWorker] ERROR intake_id=${intake_id}:`, e.message);
    try {
      await _setStatusError(intake_id, e.message);
    } catch (dbErr) {
      console.error('[mediaWorker] no se pudo marcar error en DB:', dbErr.message);
    }
  }
}

// ─── Helpers de DB ────────────────────────────────────────────────────────────

async function _setStatus(intakeId, status) {
  const pool = getPool('antojados');
  await pool.request()
    .input('status',      sql.NVarChar(20),  status)
    .input('processedAt', sql.DateTime2(3),  new Date())
    .input('intakeId',    sql.NVarChar(64),  intakeId)
    .query(`
      UPDATE antojados_core.soc_media_intake
      SET status = @status, processed_at = @processedAt
      WHERE intake_id = @intakeId
    `);
}

async function _setStatusError(intakeId, msg) {
  const pool = getPool('antojados');
  await pool.request()
    .input('msg',         sql.NVarChar(500), (msg || '').slice(0, 490))
    .input('processedAt', sql.DateTime2(3),  new Date())
    .input('intakeId',    sql.NVarChar(64),  intakeId)
    .query(`
      UPDATE antojados_core.soc_media_intake
      SET status = 'error', error_msg = @msg, processed_at = @processedAt
      WHERE intake_id = @intakeId
    `);
}

async function _insertAsset({ assetId, intakeId, channel, entityId, mediaType, mimeType, sizeBytes, remoteUrl, variants }) {
  if (channel === 'biz_post') {
    return _insertBizAsset({ assetId, intakeId, entityId, mediaType, mimeType, sizeBytes, remoteUrl, variants });
  }

  const pool = getPool('antojados');
  // post_id es nullable: el draft puede no estar publicado en soc_posts todavía.
  // El canal (feed_post) vincula el asset al post vía entity_id una vez publicado.
  await pool.request()
    .input('id',          sql.NVarChar(64),  assetId)
    .input('intakeId',    sql.NVarChar(64),  intakeId)
    .input('channel',     sql.NVarChar(30),  channel)
    .input('entityId',    sql.NVarChar(64),  entityId || null)
    .input('remoteUrl',   sql.NVarChar(500), remoteUrl || null)
    .input('mimeType',    sql.NVarChar(50),  mimeType || 'application/octet-stream')
    .input('sizeBytes',   sql.BigInt,        sizeBytes || 0)
    .input('checksum',    sql.NVarChar(64),  '')
    .input('thumbUrl',    sql.NVarChar(500), variants.thumb_url      || null)
    .input('feedUrl',     sql.NVarChar(500), variants.feed_url       || null)
    .input('fullUrl',     sql.NVarChar(500), variants.full_url       || null)
    .input('video720',    sql.NVarChar(500), variants.video_720_url  || null)
    .input('video1080',   sql.NVarChar(500), variants.video_1080_url || null)
    .query(`
      INSERT INTO antojados_core.soc_media_assets
        (id, intake_id, channel, entity_id, remote_url, mime_type, size_bytes,
         checksum_sha256, thumb_url, feed_url, full_url, video_720_url, video_1080_url)
      VALUES
        (@id, @intakeId, @channel, @entityId, @remoteUrl, @mimeType, @sizeBytes,
         @checksum, @thumbUrl, @feedUrl, @fullUrl, @video720, @video1080)
    `);
}

async function _insertBizAsset({ assetId, intakeId, entityId, mediaType, mimeType, sizeBytes, remoteUrl, variants }) {
  if (!entityId) throw new Error('mediaWorker._insertBizAsset: entityId requerido para biz_post');
  const pool = getPool('antojados');
  const result = await pool.request()
    .input('id', sql.NVarChar(64), assetId)
    .input('intakeId', sql.NVarChar(64), intakeId)
    .input('ownerPostId', sql.NVarChar(64), entityId)
    .input('mediaType', sql.NVarChar(20), mediaType)
    .input('mimeType', sql.NVarChar(100), mimeType || 'application/octet-stream')
    .input('sizeBytes', sql.BigInt, sizeBytes || 0)
    .input('checksum', sql.NVarChar(128), '')
    .input('remoteUrl', sql.NVarChar(1000), remoteUrl || null)
    .input('thumbUrl', sql.NVarChar(1000), variants.thumb_url || null)
    .input('feedUrl', sql.NVarChar(1000), variants.feed_url || null)
    .input('fullUrl', sql.NVarChar(1000), variants.full_url || null)
    .input('video720', sql.NVarChar(1000), variants.video_720_url || null)
    .input('video1080', sql.NVarChar(1000), variants.video_1080_url || null)
    .query(`
      INSERT INTO antojados_core.biz_media_assets (
        id, intake_id, owner_post_id, user_id, channel, publication_type,
        media_type, mime_type, size_bytes, checksum_sha256,
        remote_url, thumb_url, feed_url, full_url, video_720_url, video_1080_url, status
      )
      SELECT @id, @intakeId, bp.biz_post_id, bp.publisher_user_id, bp.channel, bp.publication_type,
             @mediaType, @mimeType, @sizeBytes, @checksum,
             @remoteUrl, @thumbUrl, @feedUrl, @fullUrl, @video720, @video1080, N'done'
      FROM antojados_core.biz_posts bp
      WHERE bp.biz_post_id = @ownerPostId
    `);
  if (!result.rowsAffected || result.rowsAffected[0] !== 1) {
    throw new Error('mediaWorker._insertBizAsset: biz_post no encontrado ' + entityId);
  }
}

function _deleteRaw(rawPath) {
  try {
    if (rawPath && fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
  } catch (e) {
    console.warn('[mediaWorker] no se pudo borrar raw file:', rawPath, e.message);
  }
}

module.exports = { start, stop };
