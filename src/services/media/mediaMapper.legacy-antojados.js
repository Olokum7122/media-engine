'use strict';
/**
 * mediaMapper.js — Transforma resultados del motor de media al contrato de API.
 */

function mapUserMediaList(raw) {
  if (!raw || !Array.isArray(raw.data)) {
    throw new Error(`mediaMapper.mapUserMediaList: data no es array — ${JSON.stringify(raw)}`);
  }
  return raw;
}

function mapUploadResult(raw) {
  // Videos en pending no tienen URLs aún — sólo intake_id y status.
  if (!raw?.intake_id) {
    throw new Error(`mediaMapper.mapUploadResult: intake_id faltante — ${JSON.stringify(raw)}`);
  }
  return {
    intake_id:           raw.intake_id,
    status:              raw.status,
    media_url:           raw.feed_url || raw.media_url || null,
    media_thumbnail_url: raw.thumb_url || raw.media_thumbnail_url || null,
    thumb_url:           raw.thumb_url  || null,
    feed_url:            raw.feed_url   || null,
    full_url:            raw.full_url   || null,
    video_720_url:       raw.video_720_url  || null,
    video_1080_url:      raw.video_1080_url || null,
  };
}

function mapIntakeStatus(raw) {
  if (!raw) return null;
  return {
    intake_id:     raw.intake_id,
    status:        raw.status,
    error_msg:     raw.error_msg || null,
    thumb_url:     raw.thumb_url     || null,
    feed_url:      raw.feed_url      || null,
    full_url:      raw.full_url      || null,
    video_720_url: raw.video_720_url  || null,
    video_1080_url:raw.video_1080_url || null,
  };
}

module.exports = { mapUserMediaList, mapUploadResult, mapIntakeStatus };