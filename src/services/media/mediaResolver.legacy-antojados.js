'use strict';
/**
 * mediaResolver.js — Punto de entrada al motor de media.
 *
 * uploadMedia:
 *   - Imágenes: guarda raw, crea intake, procesa inline con sharp (síncrono).
 *     Responde con las 3 URLs listas (thumb, feed, full).
 *   - Videos: guarda raw, crea intake, responde con intake_id (async).
 *     El worker (mediaIntakeWorker) procesa en background.
 *
 * getIntakeStatus: permite al cliente hacer polling de un video por intake_id.
 * getUserMedia: bandeja de assets procesados del usuario.
 */

const { getPool, sql, randomUUID, fs, pathMod } = require('./_shared');
const processor = require('./mediaProcessor');
const router    = require('./mediaChannelRouter');

function _getUploadsDir() {
  return pathMod.join(__dirname, '..', '..', '..', 'uploads');
}

function _detectRawExt(buffer, mediaType) {
  if (mediaType === 'video') return 'mp4';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'jpg';
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'webp';
  return 'jpg';
}

function _buildBaseUrl() {
  return String(process.env.API_BASE_URL || '').trim().replace(/\/+$/, '');
}

// ─── getUserMedia ─────────────────────────────────────────────────────────────

async function getUserMedia(userId, { limit = 40, offset = 0 } = {}) {
  const pool = getPool('antojados');
  const result = await pool.request()
    .input('userId', sql.NVarChar(64), userId)
    .input('limit',  sql.Int,         limit)
    .input('offset', sql.Int,         offset)
    .query(`
      SELECT ma.id, ma.remote_url, ma.thumb_url, ma.feed_url, ma.full_url,
             ma.video_720_url, ma.video_1080_url, ma.mime_type, ma.size_bytes,
             ma.channel, ma.entity_id,
             p.published_at AS created_at, p.venue_name, p.category, p.place_id
      FROM antojados_core.soc_media_assets ma
      LEFT JOIN antojados_core.soc_posts p ON p.post_id = ma.entity_id
      WHERE p.user_id = @userId
      ORDER BY p.published_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
  return { data: result.recordset, limit, offset };
}

// ─── getIntakeStatus ──────────────────────────────────────────────────────────

async function getIntakeStatus(intakeId) {
  const pool = getPool('antojados');
  const result = await pool.request()
    .input('intakeId', sql.NVarChar(64), intakeId)
    .query(`
      SELECT mi.intake_id, mi.status, mi.error_msg,
             ma.thumb_url, ma.feed_url, ma.full_url,
             ma.video_720_url, ma.video_1080_url
      FROM antojados_core.soc_media_intake mi
      LEFT JOIN antojados_core.soc_media_assets ma ON ma.intake_id = mi.intake_id
      WHERE mi.intake_id = @intakeId
    `);
  return result.recordset[0] || null;
}

// ─── uploadMedia ──────────────────────────────────────────────────────────────

/**
 * @param {string} mediaDataBase64
 * @param {'photo'|'video'} mediaType
 * @param {string} channel         — 'feed_post'|'biz_post'|'avatar'|'tile'|'gallery'
 * @param {string|null} entityId   — post_id, user_id, tile_id, etc.
 * @param {string|null} entityContext — sort_order para biz_post, null en otros
 */
async function uploadMedia(mediaDataBase64, mediaType, channel = 'gallery', entityId = null, entityContext = null) {
  const uploadsDir = _getUploadsDir();
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const buffer   = Buffer.from(mediaDataBase64, 'base64');
  const ext      = _detectRawExt(buffer, mediaType);
  const rawName  = `${randomUUID()}_raw.${ext}`;
  const rawPath  = pathMod.join(uploadsDir, rawName);
  fs.writeFileSync(rawPath, buffer);

  const mimeType  = mediaType === 'video' ? 'video/mp4' : `image/${ext}`;
  const sizeBytes = buffer.length;
  const intakeId  = randomUUID();
  const baseUrl   = _buildBaseUrl();

  // Registrar en bandeja de recepción
  await _insertIntake({ intakeId, channel, entityId, entityContext, rawPath, mediaType, mimeType, sizeBytes });

  // Imágenes: procesar inline (rápido, <400ms con sharp)
  if (mediaType === 'photo') {
    let variants;
    try {
      variants = await processor.processImage(rawPath, uploadsDir, baseUrl);
    } catch (e) {
      await _setIntakeError(intakeId, e.message);
      throw new Error(`mediaResolver: error procesando imagen — ${e.message}`);
    }

    const assetId = randomUUID();
    await _insertAsset({ assetId, intakeId, channel, entityId, mediaType, mimeType, sizeBytes, variants });

    if (entityId) {
      await router.routeToEntity(channel, entityId, entityContext, mediaType, variants, assetId);
    }

    _deleteRaw(rawPath);
    await _setIntakeDone(intakeId);

    return {
      intake_id:  intakeId,
      status:     'done',
      media_url:  variants.feed_url,
      media_thumbnail_url: variants.thumb_url,
      thumb_url:  variants.thumb_url,
      feed_url:   variants.feed_url,
      full_url:   variants.full_url,
    };
  }

  // Videos: diferido al worker
  return {
    intake_id: intakeId,
    status:    'pending',
    media_url: null,
    media_thumbnail_url: null,
    thumb_url:  null,
    feed_url:   null,
    full_url:   null,
  };
}

// ─── Helpers de DB ────────────────────────────────────────────────────────────

async function _insertIntake({ intakeId, channel, entityId, entityContext, rawPath, mediaType, mimeType, sizeBytes }) {
  const pool = getPool('antojados');
  await pool.request()
    .input('intakeId',      sql.NVarChar(64),  intakeId)
    .input('channel',       sql.NVarChar(30),  channel)
    .input('entityId',      sql.NVarChar(64),  entityId || null)
    .input('entityContext', sql.NVarChar(64),  entityContext || null)
    .input('rawPath',       sql.NVarChar(500), rawPath)
    .input('mediaType',     sql.NVarChar(10),  mediaType)
    .input('mimeType',      sql.NVarChar(50),  mimeType)
    .input('sizeBytes',     sql.BigInt,        sizeBytes)
    .query(`
      INSERT INTO antojados_core.soc_media_intake
        (intake_id, channel, entity_id, entity_context, raw_path, media_type, mime_type, size_bytes, status)
      VALUES
        (@intakeId, @channel, @entityId, @entityContext, @rawPath, @mediaType, @mimeType, @sizeBytes, 'pending')
    `);
}

async function _insertAsset({ assetId, intakeId, channel, entityId, mediaType, mimeType, sizeBytes, variants }) {
  if (channel === 'biz_post') {
    return _insertBizAsset({ assetId, intakeId, entityId, mediaType, mimeType, sizeBytes, variants });
  }

  const pool = getPool('antojados');
  await pool.request()
    .input('id',        sql.NVarChar(64),  assetId)
    .input('intakeId',  sql.NVarChar(64),  intakeId)
    .input('channel',   sql.NVarChar(30),  channel)
    .input('entityId',  sql.NVarChar(64),  entityId || null)
    .input('remoteUrl', sql.NVarChar(500), variants.feed_url || variants.thumb_url || null)
    .input('mimeType',  sql.NVarChar(50),  mimeType)
    .input('sizeBytes', sql.BigInt,        sizeBytes)
    .input('checksum',  sql.NVarChar(64),  '')
    .input('thumbUrl',  sql.NVarChar(500), variants.thumb_url      || null)
    .input('feedUrl',   sql.NVarChar(500), variants.feed_url       || null)
    .input('fullUrl',   sql.NVarChar(500), variants.full_url       || null)
    .input('v720',      sql.NVarChar(500), variants.video_720_url  || null)
    .input('v1080',     sql.NVarChar(500), variants.video_1080_url || null)
    .query(`
      INSERT INTO antojados_core.soc_media_assets
        (id, intake_id, channel, entity_id, remote_url, mime_type, size_bytes,
         checksum_sha256, thumb_url, feed_url, full_url, video_720_url, video_1080_url)
      VALUES
        (@id, @intakeId, @channel, @entityId, @remoteUrl, @mimeType, @sizeBytes,
         @checksum, @thumbUrl, @feedUrl, @fullUrl, @v720, @v1080)
    `);
}

async function _insertBizAsset({ assetId, intakeId, entityId, mediaType, mimeType, sizeBytes, variants }) {
  if (!entityId) throw new Error('mediaResolver._insertBizAsset: entityId requerido para biz_post');
  const pool = getPool('antojados');
  const result = await pool.request()
    .input('id', sql.NVarChar(64), assetId)
    .input('intakeId', sql.NVarChar(64), intakeId)
    .input('ownerPostId', sql.NVarChar(64), entityId)
    .input('mediaType', sql.NVarChar(20), mediaType)
    .input('mimeType', sql.NVarChar(100), mimeType)
    .input('sizeBytes', sql.BigInt, sizeBytes || 0)
    .input('checksum', sql.NVarChar(128), '')
    .input('remoteUrl', sql.NVarChar(1000), variants.feed_url || variants.thumb_url || null)
    .input('thumbUrl', sql.NVarChar(1000), variants.thumb_url || null)
    .input('feedUrl', sql.NVarChar(1000), variants.feed_url || null)
    .input('fullUrl', sql.NVarChar(1000), variants.full_url || null)
    .input('v720', sql.NVarChar(1000), variants.video_720_url || null)
    .input('v1080', sql.NVarChar(1000), variants.video_1080_url || null)
    .query(`
      INSERT INTO antojados_core.biz_media_assets (
        id, intake_id, owner_post_id, user_id, channel, publication_type,
        media_type, mime_type, size_bytes, checksum_sha256,
        remote_url, thumb_url, feed_url, full_url, video_720_url, video_1080_url, status
      )
      SELECT @id, @intakeId, bp.biz_post_id, bp.publisher_user_id, bp.channel, bp.publication_type,
             @mediaType, @mimeType, @sizeBytes, @checksum,
             @remoteUrl, @thumbUrl, @feedUrl, @fullUrl, @v720, @v1080, N'done'
      FROM antojados_core.biz_posts bp
      WHERE bp.biz_post_id = @ownerPostId
    `);
  if (!result.rowsAffected || result.rowsAffected[0] !== 1) {
    throw new Error('mediaResolver._insertBizAsset: biz_post no encontrado ' + entityId);
  }
}

async function _setIntakeDone(intakeId) {
  const pool = getPool('antojados');
  await pool.request()
    .input('intakeId', sql.NVarChar(64), intakeId)
    .input('now',      sql.DateTime2(3), new Date())
    .query(`UPDATE antojados_core.soc_media_intake SET status='done', processed_at=@now WHERE intake_id=@intakeId`);
}

async function _setIntakeError(intakeId, msg) {
  const pool = getPool('antojados');
  await pool.request()
    .input('msg',      sql.NVarChar(500), (msg || '').slice(0, 490))
    .input('intakeId', sql.NVarChar(64),  intakeId)
    .input('now',      sql.DateTime2(3),  new Date())
    .query(`UPDATE antojados_core.soc_media_intake SET status='error', error_msg=@msg, processed_at=@now WHERE intake_id=@intakeId`);
}

function _deleteRaw(rawPath) {
  try {
    if (rawPath && fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
  } catch (e) {
    console.warn('[mediaResolver] no se pudo borrar raw file:', rawPath, e.message);
  }
}

module.exports = { getUserMedia, uploadMedia, getIntakeStatus };