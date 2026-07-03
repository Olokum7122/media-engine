/*
ATLX MEDIA ENGINE V3 - 06 VIEWS
Run against ATLX_MediaEngine
Idempotent / No GO
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'me.v_media_ready_payload', N'V') IS NULL
    EXEC(N'CREATE VIEW me.v_media_ready_payload AS SELECT CAST(NULL AS UNIQUEIDENTIFIER) AS media_id WHERE 1 = 0');

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

IF OBJECT_ID(N'me.v_media_request_summary', N'V') IS NULL
    EXEC(N'CREATE VIEW me.v_media_request_summary AS SELECT CAST(NULL AS UNIQUEIDENTIFIER) AS media_id WHERE 1 = 0');

EXEC(N'
ALTER VIEW me.v_media_request_summary AS
    SELECT
        r.media_id,
        r.source_app,
        r.source_actor_type,
        r.source_actor_id,
        r.target_context,
        r.media_type,
        r.status,
        ro.origin_type,
        ro.rights_status,
        ro.ownership_type,
        r.created_at,
        r.updated_at,
        r.ready_at,
        COUNT(DISTINCT v.media_variant_id) AS variant_count,
        COUNT(DISTINCT j.job_id) AS job_count,
        MAX(j.error_code) AS last_job_error_code
    FROM me.media_request r
    LEFT JOIN me.media_rights_origin ro ON ro.media_id = r.media_id
    LEFT JOIN me.media_variant v ON v.media_id = r.media_id
    LEFT JOIN me.processing_job j ON j.media_id = r.media_id
    GROUP BY
        r.media_id,
        r.source_app,
        r.source_actor_type,
        r.source_actor_id,
        r.target_context,
        r.media_type,
        r.status,
        ro.origin_type,
        ro.rights_status,
        ro.ownership_type,
        r.created_at,
        r.updated_at,
        r.ready_at;
');

SELECT N'06_VIEWS_OK' AS install_step;
