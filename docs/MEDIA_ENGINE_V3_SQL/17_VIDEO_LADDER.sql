/*
ATLX MEDIA ENGINE V3 - 17 VIDEO LADDER (escalera real de video)
Run against ATLX_MediaEngine
Idempotent / No GO

PROPÓSITO
  El cliente (usePostMedia / resolveMediaFromResult) pide `video_720_url` y
  `video_1080_url`, y la vista `me.v_media_ready_payload` nunca las exponía
  porque `ck_me_variant_code` tampoco admitía esos códigos. Resultado: la app
  sólo podía reproducir `video_url` = COALESCE(short, feed_video, story), es
  decir un 1080x1920 forzado, incluso para un original horizontal.

  Esta migración:
    1. Amplía ck_me_variant_code con video_720 y video_1080.
    2. Publica ambas URLs en v_media_ready_payload.
    3. Las propaga en sp_media_get_ready_payload.

  NO crea ni modifica datos: sólo esquema. Los medios ya procesados conservan
  sus variantes y el cliente degrada con COALESCE como hasta hoy.
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

/* 1. Ampliar el CHECK de variant_code. */
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'ck_me_variant_code' AND parent_object_id = OBJECT_ID(N'me.media_variant')
)
BEGIN
    ALTER TABLE me.media_variant DROP CONSTRAINT ck_me_variant_code;
END;

ALTER TABLE me.media_variant WITH CHECK ADD CONSTRAINT ck_me_variant_code
    CHECK (variant_code IN (
        N'thumb', N'grid', N'feed', N'full', N'story', N'short', N'cover', N'avatar',
        N'video_preview', N'watermarked', N'feed_video', N'original_safe',
        N'audio_full', N'audio_preview',
        N'video_720', N'video_1080'
    ));

ALTER TABLE me.media_variant CHECK CONSTRAINT ck_me_variant_code;

/* 2. Vista de payload: publicar la escalera de video. */
EXEC(N'
ALTER VIEW me.v_media_ready_payload AS
    SELECT
        r.media_id,
        r.status,
        r.media_type,
        MAX(CASE WHEN v.variant_code = N''thumb'' THEN v.url END) AS thumb_url,
        MAX(CASE WHEN v.variant_code = N''grid'' THEN v.url END) AS grid_url,
        MAX(CASE WHEN v.variant_code = N''feed'' THEN v.url END) AS feed_url,
        MAX(CASE WHEN v.variant_code = N''full'' THEN v.url END) AS full_url,
        MAX(CASE WHEN v.variant_code = N''cover'' THEN v.url END) AS cover_url,
        COALESCE(
            MAX(CASE WHEN v.variant_code = N''short'' THEN v.url END),
            MAX(CASE WHEN v.variant_code = N''feed_video'' THEN v.url END),
            MAX(CASE WHEN v.variant_code = N''story'' AND v.media_type = N''video'' THEN v.url END)
        ) AS video_url,
        MAX(CASE WHEN v.variant_code = N''video_preview'' THEN v.url END) AS video_preview_url,
        MAX(CASE WHEN v.variant_code = N''video_720'' THEN v.url END) AS video_720_url,
        MAX(CASE WHEN v.variant_code = N''video_1080'' THEN v.url END) AS video_1080_url,
        MAX(COALESCE(v.duration_ms, o.duration_ms)) AS duration_ms,
        MAX(COALESCE(v.width, o.width)) AS width,
        MAX(COALESCE(v.height, o.height)) AS height,
        MAX(v.aspect_ratio) AS aspect_ratio,
        ro.origin_type,
        ro.origin_platform,
        ro.ownership_type,
        ro.rights_status,
        ro.license_type,
        ro.is_demo_content,
        ro.demo_disclaimer,
        ro.allow_download,
        ro.allow_share,
        r.payload_version,
        r.ready_at,
        r.ready_payload_json
    FROM me.media_request r
    LEFT JOIN me.media_rights_origin ro ON ro.media_id = r.media_id
    LEFT JOIN me.media_original o ON o.media_id = r.media_id
    LEFT JOIN me.media_variant v ON v.media_id = r.media_id AND v.is_public = 1
    GROUP BY
        r.media_id,
        r.status,
        r.media_type,
        ro.origin_type,
        ro.origin_platform,
        ro.ownership_type,
        ro.rights_status,
        ro.license_type,
        ro.is_demo_content,
        ro.demo_disclaimer,
        ro.allow_download,
        ro.allow_share,
        r.payload_version,
        r.ready_at,
        r.ready_payload_json;
');

/* 3. Propagar la escalera en el SP de payload. */
EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_get_ready_payload
    @media_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM me.media_request WHERE media_id = @media_id)
        THROW 51001, N''MEDIA_NOT_FOUND'', 1;

    SELECT
        media_id, status, media_type,
        CASE WHEN status = N''ready'' THEN thumb_url ELSE NULL END AS thumb_url,
        CASE WHEN status = N''ready'' THEN grid_url ELSE NULL END AS grid_url,
        CASE WHEN status = N''ready'' THEN feed_url ELSE NULL END AS feed_url,
        CASE WHEN status = N''ready'' THEN full_url ELSE NULL END AS full_url,
        CASE WHEN status = N''ready'' THEN cover_url ELSE NULL END AS cover_url,
        CASE WHEN status = N''ready'' THEN video_url ELSE NULL END AS video_url,
        CASE WHEN status = N''ready'' THEN video_preview_url ELSE NULL END AS video_preview_url,
        CASE WHEN status = N''ready'' THEN video_720_url ELSE NULL END AS video_720_url,
        CASE WHEN status = N''ready'' THEN video_1080_url ELSE NULL END AS video_1080_url,
        duration_ms, width, height, aspect_ratio,
        origin_type, origin_platform, ownership_type, rights_status, license_type,
        is_demo_content, demo_disclaimer, allow_download, allow_share,
        payload_version, ready_at,
        CASE WHEN status = N''ready'' THEN ready_payload_json ELSE NULL END AS ready_payload_json
    FROM me.v_media_ready_payload
    WHERE media_id = @media_id;
END;
');

SELECT N'17_VIDEO_LADDER_OK' AS install_step;
