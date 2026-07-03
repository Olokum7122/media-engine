/*
ATLX MEDIA ENGINE V3 - 09 WORKER PROCEDURES
Run against ATLX_MediaEngine
Idempotent / No GO
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_job_pick_next
    @worker_id NVARCHAR(120),
    @job_type NVARCHAR(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @picked TABLE (job_id BIGINT);

    ;WITH next_job AS (
        SELECT TOP 1 job_id
        FROM me.processing_job WITH (UPDLOCK, READPAST, ROWLOCK)
        WHERE status = N''pending''
          AND attempts < max_attempts
          AND (@job_type IS NULL OR job_type = @job_type)
        ORDER BY priority ASC, created_at ASC
    )
    UPDATE j
    SET status = N''running'',
        attempts = attempts + 1,
        locked_by = @worker_id,
        locked_at = SYSUTCDATETIME(),
        started_at = COALESCE(started_at, SYSUTCDATETIME()),
        updated_at = SYSUTCDATETIME()
    OUTPUT inserted.job_id INTO @picked(job_id)
    FROM me.processing_job j
    INNER JOIN next_job n ON n.job_id = j.job_id;

    UPDATE r
    SET status = N''processing'', updated_at = SYSUTCDATETIME()
    FROM me.media_request r
    INNER JOIN me.processing_job j ON j.media_id = r.media_id
    INNER JOIN @picked p ON p.job_id = j.job_id
    WHERE r.status NOT IN (N''ready'', N''failed'', N''rejected'', N''canceled'', N''expired'');

    SELECT
        j.job_id, j.media_id, j.job_type, j.status, j.priority, j.attempts,
        r.media_type, r.target_context, r.processing_profile_code, r.processing_profile_version, r.watermark_profile_code,
        ro.origin_type, ro.engine_watermark_policy, ro.allow_engine_watermark,
        o.original_url, o.original_storage_path, o.mime_type, o.extension, o.size_bytes, o.width, o.height, o.duration_ms, o.sha256_hash
    FROM me.processing_job j
    INNER JOIN @picked p ON p.job_id = j.job_id
    INNER JOIN me.media_request r ON r.media_id = j.media_id
    LEFT JOIN me.media_rights_origin ro ON ro.media_id = j.media_id
    LEFT JOIN me.media_original o ON o.media_id = j.media_id
    ORDER BY o.created_at DESC;
END;
');

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_job_mark_running
    @job_id BIGINT,
    @worker_id NVARCHAR(120)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE me.processing_job
    SET status = N''running'', locked_by = @worker_id, locked_at = SYSUTCDATETIME(),
        started_at = COALESCE(started_at, SYSUTCDATETIME()), updated_at = SYSUTCDATETIME()
    WHERE job_id = @job_id AND status IN (N''pending'', N''running'');

    SELECT job_id, media_id, status, locked_by, locked_at
    FROM me.processing_job
    WHERE job_id = @job_id;
END;
');

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_variant_upsert
    @media_id UNIQUEIDENTIFIER,
    @variant_code NVARCHAR(40),
    @media_type NVARCHAR(20),
    @url NVARCHAR(1200),
    @storage_path NVARCHAR(1200) = NULL,
    @mime_type NVARCHAR(120),
    @width INT = NULL,
    @height INT = NULL,
    @duration_ms INT = NULL,
    @size_bytes BIGINT = NULL,
    @aspect_ratio NVARCHAR(20) = NULL,
    @codec NVARCHAR(80) = NULL,
    @bitrate_kbps INT = NULL,
    @fps DECIMAL(6,2) = NULL,
    @has_watermark BIT = 0,
    @is_default BIT = 0,
    @is_public BIT = 1,
    @processing_profile_code NVARCHAR(60) = N''standard'',
    @profile_version INT = 1,
    @payload_version INT = 3
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM me.media_request WHERE media_id = @media_id)
        THROW 51001, N''MEDIA_NOT_FOUND'', 1;

    IF EXISTS (SELECT 1 FROM me.media_variant WHERE media_id = @media_id AND variant_code = @variant_code)
    BEGIN
        UPDATE me.media_variant
        SET media_type = @media_type, url = @url, storage_path = @storage_path, mime_type = @mime_type,
            width = @width, height = @height, duration_ms = @duration_ms, size_bytes = @size_bytes,
            aspect_ratio = @aspect_ratio, codec = @codec, bitrate_kbps = @bitrate_kbps, fps = @fps,
            has_watermark = COALESCE(@has_watermark, 0), is_default = COALESCE(@is_default, 0),
            is_public = COALESCE(@is_public, 1), processing_profile_code = COALESCE(@processing_profile_code, N''standard''),
            profile_version = COALESCE(@profile_version, 1), payload_version = COALESCE(@payload_version, 3),
            updated_at = SYSUTCDATETIME()
        WHERE media_id = @media_id AND variant_code = @variant_code;
    END
    ELSE
    BEGIN
        INSERT INTO me.media_variant (
            media_id, variant_code, media_type, url, storage_path, mime_type, width, height,
            duration_ms, size_bytes, aspect_ratio, codec, bitrate_kbps, fps, has_watermark,
            is_default, is_public, processing_profile_code, profile_version, payload_version
        )
        VALUES (
            @media_id, @variant_code, @media_type, @url, @storage_path, @mime_type, @width, @height,
            @duration_ms, @size_bytes, @aspect_ratio, @codec, @bitrate_kbps, @fps, COALESCE(@has_watermark, 0),
            COALESCE(@is_default, 0), COALESCE(@is_public, 1), COALESCE(@processing_profile_code, N''standard''),
            COALESCE(@profile_version, 1), COALESCE(@payload_version, 3)
        );
    END;

    INSERT INTO me.media_event_log (media_id, event_code, event_message)
    VALUES (@media_id, N''VARIANT_UPSERTED'', CONCAT(N''Variant upserted: '', @variant_code));

    SELECT media_variant_id, media_id, variant_code, media_type, url, width, height, duration_ms, size_bytes, aspect_ratio
    FROM me.media_variant
    WHERE media_id = @media_id AND variant_code = @variant_code;
END;
');

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_mark_ready
    @media_id UNIQUEIDENTIFIER,
    @job_id BIGINT = NULL,
    @ready_payload_json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @media_type NVARCHAR(20);

    SELECT @media_type = media_type FROM me.media_request WHERE media_id = @media_id;

    IF @media_type IS NULL
        THROW 51001, N''MEDIA_NOT_FOUND'', 1;

    IF NOT EXISTS (SELECT 1 FROM me.media_original WHERE media_id = @media_id)
        THROW 51002, N''ORIGINAL_NOT_REGISTERED'', 1;

    IF NOT EXISTS (SELECT 1 FROM me.media_rights_origin WHERE media_id = @media_id)
        THROW 51010, N''RIGHTS_ORIGIN_REQUIRED'', 1;

    IF EXISTS (
        SELECT 1 FROM me.media_rights_origin
        WHERE media_id = @media_id
          AND (rights_status IN (N''rejected'', N''takedown_requested'', N''removed'') OR engine_watermark_policy = N''blocked'')
    )
        THROW 51011, N''RIGHTS_BLOCKED'', 1;

    IF NOT EXISTS (SELECT 1 FROM me.media_variant WHERE media_id = @media_id AND is_public = 1)
        THROW 51003, N''VARIANT_REQUIRED'', 1;

    IF @media_type = N''image''
       AND NOT EXISTS (SELECT 1 FROM me.media_variant WHERE media_id = @media_id AND variant_code IN (N''thumb'', N''grid'', N''feed'') AND is_public = 1)
        THROW 51003, N''VARIANT_REQUIRED'', 1;

    IF @media_type = N''video''
       AND NOT EXISTS (SELECT 1 FROM me.media_variant WHERE media_id = @media_id AND variant_code = N''video_preview'' AND is_public = 1)
        THROW 51004, N''VIDEO_PREVIEW_REQUIRED'', 1;

    IF @media_type = N''video''
       AND NOT EXISTS (SELECT 1 FROM me.media_variant WHERE media_id = @media_id AND variant_code IN (N''short'', N''feed_video'', N''story'') AND media_type = N''video'' AND is_public = 1)
        THROW 51003, N''VARIANT_REQUIRED'', 1;

    UPDATE me.media_request
    SET status = N''ready'', ready_payload_json = @ready_payload_json, ready_at = SYSUTCDATETIME(),
        updated_at = SYSUTCDATETIME(), error_code = NULL, error_message = NULL
    WHERE media_id = @media_id AND status NOT IN (N''canceled'', N''rejected'', N''expired'');

    IF @job_id IS NOT NULL
    BEGIN
        UPDATE me.processing_job
        SET status = N''done'', finished_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME()
        WHERE job_id = @job_id;
    END;

    INSERT INTO me.media_event_log (media_id, job_id, event_code, event_message)
    VALUES (@media_id, @job_id, N''MEDIA_READY'', N''Media marked ready'');

    EXEC me.sp_media_get_ready_payload @media_id = @media_id;
END;
');

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_mark_failed
    @media_id UNIQUEIDENTIFIER,
    @job_id BIGINT = NULL,
    @error_code NVARCHAR(80),
    @error_message NVARCHAR(2000) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE me.media_request
    SET status = N''failed'', error_code = @error_code, error_message = @error_message,
        failed_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME()
    WHERE media_id = @media_id AND status NOT IN (N''ready'', N''canceled'', N''rejected'', N''expired'');

    IF @job_id IS NOT NULL
    BEGIN
        UPDATE me.processing_job
        SET status = N''failed'', error_code = @error_code, error_message = @error_message,
            finished_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME()
        WHERE job_id = @job_id;
    END;

    INSERT INTO me.media_event_log (media_id, job_id, event_code, event_message)
    VALUES (@media_id, @job_id, N''MEDIA_FAILED'', @error_message);

    SELECT media_id, status, error_code, error_message
    FROM me.media_request
    WHERE media_id = @media_id;
END;
');

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_mark_rejected
    @media_id UNIQUEIDENTIFIER,
    @reason NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE me.media_request
    SET status = N''rejected'', moderation_status = N''rejected'', rejection_reason = @reason,
        rejected_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME()
    WHERE media_id = @media_id AND status NOT IN (N''ready'', N''canceled'', N''expired'');

    UPDATE me.processing_job
    SET status = N''canceled'', finished_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME()
    WHERE media_id = @media_id AND status IN (N''pending'', N''running'');

    INSERT INTO me.media_event_log (media_id, event_code, event_message)
    VALUES (@media_id, N''MEDIA_REJECTED'', @reason);

    SELECT media_id, status, moderation_status, rejection_reason
    FROM me.media_request
    WHERE media_id = @media_id;
END;
');

SELECT N'09_PROCEDURES_WORKER_OK' AS install_step;
