'use strict';

/**
 * mediaPackageMapper.js — Mapeo de variantes engine → formato Gateway
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMINIO:      AntojadosMX — Adaptador entre Media Engine y Antojados Gateway
 * RESPONSABLE:  Transformar el ready-payload del engine al formato que esperan
 *               bizResolver.js y postsResolver.js
 *
 * NO HACE:
 *   - No consume endpoints del engine (lo hace engineClient.js)
 *   - No escribe en BD (lo hace bizResolver / postsResolver)
 *   - No valida políticas de derechos (lo hace policyEvaluator)
 *
 * MAPEO:
 *   Engine Variant     → Gateway alias     → BD column
 *   ────────────────   ─────────────────   ─────────────────
 *   thumbUrl           → thumb_url          → thumb_url
 *   feedUrl            → feed_url           → media_url (principal)
 *   fullUrl            → full_url           → full_url
 *   videoUrl           → video_url          → (futuro)
 *   videoPreviewUrl    → video_preview_url  → (futuro)
 *
 *   Los nombres en el engine usan camelCase (payload service),
 *   el Gateway espera snake_case (biz_post_media columns).
 *
 * REFERENCIAS:
 *   - engineClient.js → getReadyPayload() llama al engine y recibe camelCase
 *   - bizResolver.js → publishBizPost() espera { thumb_url, feed_url, full_url }
 *   - apps-antojados/docs/feed.md (Sección 10.2: Ready Payload)
 * ══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Mapea el payload crudo del engine al formato que espera el Gateway.
 * El engine devuelve camelCase (thumbUrl, feedUrl), el Gateway espera snake_case.
 *
 * @param {object} enginePayload - Payload directo del GET /ready-payload
 * @returns {object|null} - { thumb_url, feed_url, full_url, video_url?, video_preview_url?, ... } o null
 */
function mapToGatewayFormat(enginePayload) {
  if (!enginePayload) return null;

  const payload = enginePayload.payload || enginePayload;

  return {
    thumb_url: payload.thumbUrl || null,
    grid_url: payload.gridUrl || null,
    feed_url: payload.feedUrl || null,
    full_url: payload.fullUrl || null,
    cover_url: payload.coverUrl || null,
    video_url: payload.videoUrl || null,
    video_preview_url: payload.videoPreviewUrl || null,
    width: payload.width || null,
    height: payload.height || null,
    aspect_ratio: payload.aspectRatio || null,
    rights_status: payload.rightsStatus || null,
    is_demo_content: payload.isDemoContent || false,
  };
}

/**
 * Extrae solo los campos que necesita biz_post_media / soc_post_media.
 *
 * @param {object} enginePayload
 * @returns {object} - { thumb_url, feed_url, full_url, asset_id }
 */
function mapToMediaRow(enginePayload, mediaIntakeId) {
  const mapped = mapToGatewayFormat(enginePayload);
  if (!mapped) return null;

  return {
    thumb_url: mapped.thumb_url,
    feed_url: mapped.feed_url,
    full_url: mapped.full_url,
    asset_id: mediaIntakeId || null,
  };
}

/**
 * Mapea desde el response crudo de engineClient.getReadyPayload()
 * El engineClient devuelve directamente { thumb_url, feed_url, full_url }
 * porque ya hace su propio mapeo. Esta función es para uso directo del route.
 *
 * @param {object} raw - Respuesta directa del route /ready-payload
 * @returns {object}
 */
function mapFromReadyRoute(raw) {
  if (!raw) return null;
  // Si el route devuelve { mediaId, status, ready, payload: {...} }
  if (raw.payload) {
    return mapToGatewayFormat(raw);
  }
  // Si ya está en formato plano
  return {
    thumb_url: raw.thumb_url || raw.thumbUrl || null,
    feed_url: raw.feed_url || raw.feedUrl || null,
    full_url: raw.full_url || raw.fullUrl || null,
    video_url: raw.video_url || raw.videoUrl || null,
    video_preview_url: raw.video_preview_url || raw.videoPreviewUrl || null,
  };
}

module.exports = {
  mapToGatewayFormat,
  mapToMediaRow,
  mapFromReadyRoute,
};
