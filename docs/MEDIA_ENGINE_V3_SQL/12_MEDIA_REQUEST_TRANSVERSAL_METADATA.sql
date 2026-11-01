/*
ATLX MEDIA ENGINE V3 - 12 MEDIA REQUEST TRANSVERSAL METADATA
Run against ATLX_MediaEngine
No GO

Objetivo:
- Persistir metadata transversal enviada por clientes v1:
  channel, post_id, sponsor_id, user_id.
- Exponer esa metadata en ready_payload para consumidores como Editorial.
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_request_create
    @source_app NVARCHAR(30),
    @source_actor_type NVARCHAR(30),
    @source_actor_id NVARCHAR(120),
    @target_context NVARCHAR(40),
    @media_type NVARCHAR(20),
    @client_reference_id NVARCHAR(160) = NULL,
    @external_context_id NVARCHAR(160) = NULL,
    @external_trace_id NVARCHAR(160) = NULL,
    @processing_profile_code NVARCHAR(60) = N''standard'',
    @processing_profile_version INT = 1,
    @watermark_profile_code NVARCHAR(60) = NULL,
    @channel NVARCHAR(40) = NULL,
    @post_id NVARCHAR(80) = NULL,
    @sponsor_id NVARCHAR(80) = NULL,
    @user_id NVARCHAR(80) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @media_id UNIQUEIDENTIFIER;

    SELECT @media_id = media_id
    FROM me.media_request
    WHERE source_app = @source_app
      AND client_reference_id = @client_reference_id
      AND @client_reference_id IS NOT NULL;

    IF @media_id IS NULL
    BEGIN
        SET @media_id = NEWID();

        INSERT INTO me.media_request (
            media_id, source_app, source_actor_type, source_actor_id, target_context,
            external_context_id, external_trace_id, client_reference_id, media_type,
            processing_profile_code, processing_profile_version, watermark_profile_code,
            channel, post_id, sponsor_id, user_id,
            status
        )
        VALUES (
            @media_id, @source_app, @source_actor_type, @source_actor_id, @target_context,
            @external_context_id, @external_trace_id, @client_reference_id, @media_type,
            COALESCE(@processing_profile_code, N''standard''), COALESCE(@processing_profile_version, 1),
            @watermark_profile_code,
            @channel, @post_id, @sponsor_id, @user_id,
            N''received''
        );

        INSERT INTO me.media_event_log (media_id, event_code, event_message)
        VALUES (@media_id, N''MEDIA_REQUEST_CREATED'', N''Media request created'');
    END;

    SELECT media_id, status, created_at
    FROM me.media_request
    WHERE media_id = @media_id;
END;
');

EXEC(N'
ALTER VIEW me.v_media_ready_payload AS
    SELECT
        r.media_id,
        r.status,
        r.media_type,
        r.channel,
        r.post_id,
        r.sponsor_id,
        r.user_id,
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
        r.channel,
        r.post_id,
        r.sponsor_id,
        r.user_id,
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

SELECT N'12_MEDIA_REQUEST_TRANSVERSAL_METADATA_OK' AS install_step;
