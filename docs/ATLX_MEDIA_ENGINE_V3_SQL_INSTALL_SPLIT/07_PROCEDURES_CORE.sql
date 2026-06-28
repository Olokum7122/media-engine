/*
ATLX MEDIA ENGINE V3 - 07 CORE PROCEDURES
Run against ATLX_MediaEngine
Idempotent / No GO
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
    @watermark_profile_code NVARCHAR(60) = NULL
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
            processing_profile_code, processing_profile_version, watermark_profile_code, status
        )
        VALUES (
            @media_id, @source_app, @source_actor_type, @source_actor_id, @target_context,
            @external_context_id, @external_trace_id, @client_reference_id, @media_type,
            COALESCE(@processing_profile_code, N''standard''), COALESCE(@processing_profile_version, 1),
            @watermark_profile_code, N''received''
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
CREATE OR ALTER PROCEDURE me.sp_media_original_register
    @media_id UNIQUEIDENTIFIER,
    @original_file_name NVARCHAR(260) = NULL,
    @original_url NVARCHAR(1200) = NULL,
    @original_storage_path NVARCHAR(1200) = NULL,
    @mime_type NVARCHAR(120),
    @extension NVARCHAR(20) = NULL,
    @size_bytes BIGINT = NULL,
    @width INT = NULL,
    @height INT = NULL,
    @duration_ms INT = NULL,
    @orientation NVARCHAR(30) = NULL,
    @sha256_hash CHAR(64) = NULL,
    @exif_json NVARCHAR(MAX) = NULL,
    @metadata_json NVARCHAR(MAX) = NULL,
    @priority INT = 100
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM me.media_request WHERE media_id = @media_id)
        THROW 51001, N''MEDIA_NOT_FOUND'', 1;

    IF NOT EXISTS (SELECT 1 FROM me.media_rights_origin WHERE media_id = @media_id)
        THROW 51010, N''RIGHTS_ORIGIN_REQUIRED'', 1;

    INSERT INTO me.media_original (
        media_id, original_file_name, original_url, original_storage_path, mime_type,
        extension, size_bytes, width, height, duration_ms, orientation, sha256_hash,
        exif_json, metadata_json
    )
    VALUES (
        @media_id, @original_file_name, @original_url, @original_storage_path, @mime_type,
        @extension, @size_bytes, @width, @height, @duration_ms, @orientation, @sha256_hash,
        @exif_json, @metadata_json
    );

    UPDATE me.media_request
    SET status = N''queued'', uploaded_at = COALESCE(uploaded_at, SYSUTCDATETIME()), updated_at = SYSUTCDATETIME()
    WHERE media_id = @media_id AND status NOT IN (N''ready'', N''canceled'', N''rejected'', N''expired'');

    INSERT INTO me.processing_job (media_id, job_type, status, priority)
    VALUES (@media_id, N''full_pipeline'', N''pending'', COALESCE(@priority, 100));

    DECLARE @job_id BIGINT = SCOPE_IDENTITY();

    INSERT INTO me.media_event_log (media_id, job_id, event_code, event_message)
    VALUES (@media_id, @job_id, N''ORIGINAL_REGISTERED'', N''Original media registered and processing job queued'');

    SELECT @media_id AS media_id, status, @job_id AS job_id
    FROM me.media_request
    WHERE media_id = @media_id;
END;
');

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
        duration_ms, width, height, aspect_ratio,
        origin_type, origin_platform, ownership_type, rights_status, license_type,
        is_demo_content, demo_disclaimer, allow_download, allow_share,
        payload_version, ready_at,
        CASE WHEN status = N''ready'' THEN ready_payload_json ELSE NULL END AS ready_payload_json
    FROM me.v_media_ready_payload
    WHERE media_id = @media_id;
END;
');

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_get_by_id
    @media_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM me.media_request WHERE media_id = @media_id)
        THROW 51001, N''MEDIA_NOT_FOUND'', 1;

    SELECT * FROM me.media_request WHERE media_id = @media_id;
    SELECT * FROM me.media_rights_origin WHERE media_id = @media_id;
    SELECT * FROM me.media_original WHERE media_id = @media_id ORDER BY created_at DESC;
    SELECT * FROM me.media_variant WHERE media_id = @media_id ORDER BY variant_code;
    SELECT TOP 30 * FROM me.processing_job WHERE media_id = @media_id ORDER BY created_at DESC;
    SELECT TOP 80 * FROM me.media_event_log WHERE media_id = @media_id ORDER BY created_at DESC;
END;
');

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_cancel
    @media_id UNIQUEIDENTIFIER,
    @reason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM me.media_request WHERE media_id = @media_id)
        THROW 51001, N''MEDIA_NOT_FOUND'', 1;

    UPDATE me.media_request
    SET status = N''canceled'', canceled_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME(), error_message = @reason
    WHERE media_id = @media_id AND status NOT IN (N''ready'', N''rejected'', N''expired'');

    UPDATE me.processing_job
    SET status = N''canceled'', finished_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME()
    WHERE media_id = @media_id AND status IN (N''pending'', N''running'');

    INSERT INTO me.media_event_log (media_id, event_code, event_message)
    VALUES (@media_id, N''MEDIA_CANCELED'', @reason);

    SELECT media_id, status, canceled_at
    FROM me.media_request
    WHERE media_id = @media_id;
END;
');

SELECT N'07_PROCEDURES_CORE_OK' AS install_step;
