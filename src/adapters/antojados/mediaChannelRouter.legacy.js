'use strict';
/**
 * mediaChannelRouter.js — Enruta las variantes procesadas a la entidad destino.
 *
 * Channels disponibles:
 *   feed_post  → UPDATE antojados_core.soc_posts  (thumb + feed + full)
 *   biz_post   → INSERT antojados_core.biz_post_media (entity_context = sort_order)
 *   avatar     → UPDATE antojados_core.auth_identities (solo thumb)
 *   tile       → UPDATE antojados_core.biz_tenant_tiles (feed_url como media_url)
 *   gallery    → sin UPDATE adicional (solo soc_media_assets)
 *
 * Cada función recibe { entityId, entityContext, variants } y escribe en DB.
 * Lanza excepción si entityId falta en canales que lo requieren.
 */

const { getPool, sql } = require('../../db');

// ─── Router principal ─────────────────────────────────────────────────────────

/**
 * @param {string} channel
 * @param {string|null} entityId
 * @param {string|null} entityContext
 * @param {'photo'|'video'} mediaType
 * @param {object} variants  — { thumb_url, feed_url, full_url, video_720_url, video_1080_url }
 * @param {string|null} assetId
 */
async function routeToEntity(channel, entityId, entityContext, mediaType, variants, assetId = null) {
  switch (channel) {
    case 'feed_post':
      return _updateFeedPost(entityId, variants);
    case 'biz_post':
      return _insertBizPostMedia(entityId, entityContext, mediaType, variants, assetId);
    case 'avatar':
      return _updateAvatar(entityId, variants);
    case 'tile':
      return _updateTile(entityId, variants);
    case 'gallery':
      return; // solo registro en soc_media_assets, sin UPDATE adicional
    default:
      throw new Error(`mediaChannelRouter: channel desconocido '${channel}'`);
  }
}

// ─── Handlers por canal ───────────────────────────────────────────────────────

async function _updateFeedPost(postId, variants) {
  if (!postId) throw new Error('mediaChannelRouter._updateFeedPost: postId requerido');
  const pool = getPool('antojados');
  // Para video: video_720_url se convierte en la URL canónica (media_url y media_feed_url)
  // soc_posts no tiene columna video_720_url, se mapea a media_url
  const canonicalUrl = variants.video_720_url || variants.feed_url || null;
  await pool.request()
    .input('thumbUrl',    sql.NVarChar(500), variants.thumb_url   || null)
    .input('canonicalUrl',sql.NVarChar(500), canonicalUrl)
    .input('fullUrl',     sql.NVarChar(500), variants.full_url    || null)
    .input('postId',      sql.NVarChar(64),  postId)
    .query(`
      UPDATE antojados_core.soc_posts
      SET media_thumbnail_url = COALESCE(@thumbUrl,     media_thumbnail_url),
          media_feed_url      = COALESCE(@canonicalUrl, media_feed_url),
          media_full_url      = COALESCE(@fullUrl,      media_full_url),
          media_url           = COALESCE(@canonicalUrl, @thumbUrl, media_url)
      WHERE post_id = @postId
    `);
}

async function _insertBizPostMedia(postId, entityContext, mediaType, variants, assetId) {
  if (!postId) throw new Error('mediaChannelRouter._insertBizPostMedia: postId requerido');
  const sortOrder = parseInt(entityContext, 10) || 0;
  const mediaUrl  = variants.feed_url || variants.thumb_url || null;
  if (!mediaUrl) return;

  const pool = getPool('antojados');
  await pool.request()
    .input('post_id', sql.NVarChar(64), postId)
    .input('asset_id', sql.NVarChar(64), assetId || null)
    .input('media_type', sql.NVarChar(20), mediaType)
    .input('media_url', sql.NVarChar(1000), mediaUrl)
    .input('thumb_url', sql.NVarChar(1000), variants.thumb_url || null)
    .input('feed_url', sql.NVarChar(1000), variants.feed_url || mediaUrl)
    .input('full_url', sql.NVarChar(1000), variants.full_url || null)
    .input('sort_order', sql.Int, sortOrder)
    .execute('antojados_core.sp_biz_post_media_attach');
}

async function _updateAvatar(userId, variants) {
  if (!userId) throw new Error('mediaChannelRouter._updateAvatar: userId requerido');
  const avatarUrl = variants.thumb_url || variants.feed_url || null;
  if (!avatarUrl) return;

  const pool = getPool('antojados');
  await pool.request()
    .input('avatarUrl', sql.NVarChar(500), avatarUrl)
    .input('userId',    sql.NVarChar(64),  userId)
    .query(`
      UPDATE antojados_core.auth_identities
      SET avatar_url = @avatarUrl, updated_at = SYSUTCDATETIME()
      WHERE user_id = @userId
    `);
}

async function _updateTile(tileId, variants) {
  if (!tileId) throw new Error('mediaChannelRouter._updateTile: tileId requerido');
  const mediaUrl = variants.feed_url || variants.thumb_url || null;
  if (!mediaUrl) return;

  const pool = getPool('antojados');
  await pool.request()
    .input('mediaUrl', sql.NVarChar(500), mediaUrl)
    .input('tileId',   sql.NVarChar(64),  tileId)
    .query(`
      UPDATE antojados_core.biz_tenant_tiles
      SET media_url = @mediaUrl
      WHERE id = @tileId
    `);
}

module.exports = { routeToEntity };
