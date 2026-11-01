/*
ATLX MEDIA ENGINE V3 - 23 READY PAYLOAD: METADATA + AVATAR/STORY + AUDIO
Run against ATLX_MediaEngine

POR QUÉ EXISTE
--------------
`me.v_media_ready_payload` y `me.sp_media_get_ready_payload` se redefinieron
varias veces y el último gana. Estado medido en la base instalada el 2026-11-01:

  · La vista tiene 28 columnas e incluye el ladder de vídeo (short, feed_video,
    video_720, video_1080), pero NO publica la metadata transversal
    (channel, post_id, sponsor_id, user_id): la 17 se aplicó DESPUÉS de la 12 y
    borró lo que la 12 había añadido.
  · La vista NO publica `avatar_url` ni `story_url`, aunque ambas variantes
    existen en catálogo, en el CHECK y en datos (295 filas cada una). El mapper
    `payloadService.getReadyPayload` las lee (`row.avatar_url`, `row.story_url`)
    y las entrega `undefined`: el avatar no viaja en el payload.
  · La vista NO publica audio. `mediaProcessorV3.processAudio` declara
    `audio_full` y `media_variant_catalog` admite además `audio_preview`, pero
    ningún payload los exponía: un audio podía quedar `ready` con el archivo
    publicado y el cliente sin URL que reproducir.
  · `me.sp_media_get_ready_payload` (17) selecciona columnas explícitas: aunque
    se arregle la vista, el endpoint seguiría devolviendo el contrato viejo. Por
    eso esta migración publica TAMBIÉN el procedimiento.

QUÉ HACE
--------
1. Publica la definición FINAL de la vista: superset de 06, 12 y 17 + avatar,
   story y audio. Conserva las 28 columnas originales EN SU ORDEN y añade las
   nuevas AL FINAL, de modo que ningún consumidor posicional (`SELECT *`) se
   rompe.
2. Publica `sp_media_get_ready_payload` con esas mismas columnas, manteniendo el
   gating por `status = 'ready'` que ya tenía.

NO cambia tablas, catálogos, CHECK ni datos. No crea campos: `avatar`, `story`,
`audio_full` y `audio_preview` ya están en `me.media_variant_catalog` y en
`ck_me_variant_code`.

NOTA SOBRE audio_preview
------------------------
El código lo admite y lo publica en el payload, pero hoy NO hay productor:
`processAudio` emite sólo `audio_full` (mide con ffprobe y publica referencia al
original sin recodificar). La columna devuelve NULL hasta que exista un productor
de preview; se declara ahora para que el contrato no vuelva a cambiar cuando
aparezca.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

/* 1. Vista final. Orden original + columnas nuevas al final. */
EXEC(N'
CREATE OR ALTER VIEW me.v_media_ready_payload AS
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
        r.ready_payload_json,
        /* ── Nuevas (23). Siempre al final: no altera posiciones previas. ── */
        MAX(CASE WHEN v.variant_code = N''avatar'' THEN v.url END) AS avatar_url,
        MAX(CASE WHEN v.variant_code = N''story'' THEN v.url END) AS story_url,
        MAX(CASE WHEN v.variant_code = N''audio_full'' THEN v.url END) AS audio_url,
        MAX(CASE WHEN v.variant_code = N''audio_preview'' THEN v.url END) AS audio_preview_url,
        r.channel,
        r.post_id,
        r.sponsor_id,
        r.user_id
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
        r.ready_payload_json,
        r.channel,
        r.post_id,
        r.sponsor_id,
        r.user_id;
');

/* 2. El procedimiento es la puerta real del endpoint: mismo contrato. */
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
        CASE WHEN status = N''ready'' THEN ready_payload_json ELSE NULL END AS ready_payload_json,
        CASE WHEN status = N''ready'' THEN avatar_url ELSE NULL END AS avatar_url,
        CASE WHEN status = N''ready'' THEN story_url ELSE NULL END AS story_url,
        CASE WHEN status = N''ready'' THEN audio_url ELSE NULL END AS audio_url,
        CASE WHEN status = N''ready'' THEN audio_preview_url ELSE NULL END AS audio_preview_url,
        channel, post_id, sponsor_id, user_id
    FROM me.v_media_ready_payload
    WHERE media_id = @media_id;
END;
');

SELECT N'23_READY_PAYLOAD_OK' AS install_step;
