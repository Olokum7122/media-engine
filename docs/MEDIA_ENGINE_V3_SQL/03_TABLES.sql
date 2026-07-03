/*
ATLX MEDIA ENGINE V3 - 03 CORE TABLES
Run against ATLX_MediaEngine
Idempotent / No GO
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'me.media_request', N'U') IS NULL
    BEGIN
        CREATE TABLE me.media_request (
            media_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT pk_me_media_request PRIMARY KEY DEFAULT NEWID(),
            source_app NVARCHAR(30) NOT NULL,
            source_actor_type NVARCHAR(30) NOT NULL,
            source_actor_id NVARCHAR(120) NOT NULL,
            target_context NVARCHAR(40) NOT NULL,
            external_context_id NVARCHAR(160) NULL,
            external_trace_id NVARCHAR(160) NULL,
            client_reference_id NVARCHAR(160) NULL,
            media_type NVARCHAR(20) NOT NULL,
            processing_profile_code NVARCHAR(60) NOT NULL CONSTRAINT df_me_request_profile DEFAULT N'standard',
            processing_profile_version INT NOT NULL CONSTRAINT df_me_request_profile_version DEFAULT 1,
            watermark_profile_code NVARCHAR(60) NULL,
            status NVARCHAR(30) NOT NULL CONSTRAINT df_me_request_status DEFAULT N'received',
            moderation_status NVARCHAR(30) NOT NULL CONSTRAINT df_me_request_moderation DEFAULT N'none',
            rejection_reason NVARCHAR(500) NULL,
            ready_payload_json NVARCHAR(MAX) NULL,
            payload_version INT NOT NULL CONSTRAINT df_me_request_payload_version DEFAULT 3,
            error_code NVARCHAR(80) NULL,
            error_message NVARCHAR(2000) NULL,
            created_at DATETIME2(3) NOT NULL CONSTRAINT df_me_request_created DEFAULT SYSUTCDATETIME(),
            updated_at DATETIME2(3) NOT NULL CONSTRAINT df_me_request_updated DEFAULT SYSUTCDATETIME(),
            uploaded_at DATETIME2(3) NULL,
            ready_at DATETIME2(3) NULL,
            failed_at DATETIME2(3) NULL,
            rejected_at DATETIME2(3) NULL,
            canceled_at DATETIME2(3) NULL,
            expired_at DATETIME2(3) NULL,
            CONSTRAINT ck_me_request_source_app CHECK (source_app IN (N'android', N'ios', N'explorer', N'web', N'admin', N'worker')),
            CONSTRAINT ck_me_request_actor_type CHECK (source_actor_type IN (N'user', N'sponsor', N'explorer', N'employee', N'admin', N'system')),
            CONSTRAINT ck_me_request_context CHECK (target_context IN (N'post', N'short', N'pachanga', N'profile', N'sponsor', N'event', N'promo', N'cover', N'avatar', N'story', N'gallery', N'fullscreen')),
            CONSTRAINT ck_me_request_media_type CHECK (media_type IN (N'image', N'video')),
            CONSTRAINT ck_me_request_status CHECK (status IN (N'received', N'uploading', N'uploaded', N'queued', N'processing', N'ready', N'failed', N'rejected', N'canceled', N'expired')),
            CONSTRAINT ck_me_request_moderation CHECK (moderation_status IN (N'none', N'pending', N'approved', N'rejected', N'manual_review'))
        );
    END;

    IF OBJECT_ID(N'me.media_rights_origin', N'U') IS NULL
    BEGIN
        CREATE TABLE me.media_rights_origin (
            media_rights_origin_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_me_media_rights_origin PRIMARY KEY,
            media_id UNIQUEIDENTIFIER NOT NULL,
            origin_type NVARCHAR(40) NOT NULL,
            origin_platform NVARCHAR(40) NOT NULL,
            origin_url NVARCHAR(1200) NULL,
            original_author_name NVARCHAR(160) NULL,
            original_author_handle NVARCHAR(160) NULL,
            original_watermark_detected BIT NOT NULL CONSTRAINT df_me_rights_watermark_detected DEFAULT 0,
            engine_watermark_policy NVARCHAR(40) NOT NULL CONSTRAINT df_me_rights_watermark_policy DEFAULT N'skip',
            ownership_type NVARCHAR(40) NOT NULL CONSTRAINT df_me_rights_ownership DEFAULT N'unknown',
            employment_generated BIT NOT NULL CONSTRAINT df_me_rights_employment DEFAULT 0,
            license_scope NVARCHAR(80) NOT NULL CONSTRAINT df_me_rights_license_scope DEFAULT N'unknown',
            rights_declaration NVARCHAR(60) NOT NULL CONSTRAINT df_me_rights_declaration DEFAULT N'unknown',
            rights_status NVARCHAR(40) NOT NULL CONSTRAINT df_me_rights_status DEFAULT N'pending',
            license_type NVARCHAR(60) NOT NULL CONSTRAINT df_me_rights_license DEFAULT N'unknown',
            is_demo_content BIT NOT NULL CONSTRAINT df_me_rights_demo DEFAULT 0,
            demo_disclaimer NVARCHAR(500) NULL,
            allow_public_display BIT NOT NULL CONSTRAINT df_me_rights_public DEFAULT 0,
            allow_download BIT NOT NULL CONSTRAINT df_me_rights_download DEFAULT 0,
            allow_share BIT NOT NULL CONSTRAINT df_me_rights_share DEFAULT 1,
            allow_remix BIT NOT NULL CONSTRAINT df_me_rights_remix DEFAULT 0,
            allow_engine_watermark BIT NOT NULL CONSTRAINT df_me_rights_engine_wm DEFAULT 0,
            created_at DATETIME2(3) NOT NULL CONSTRAINT df_me_rights_created DEFAULT SYSUTCDATETIME(),
            updated_at DATETIME2(3) NOT NULL CONSTRAINT df_me_rights_updated DEFAULT SYSUTCDATETIME(),
            CONSTRAINT fk_me_rights_request FOREIGN KEY (media_id) REFERENCES me.media_request(media_id),
            CONSTRAINT ck_me_rights_origin_type CHECK (origin_type IN (N'official_antojados', N'explorer_partner', N'created_in_antojados', N'uploaded_by_owner', N'licensed_content', N'external_platform', N'demo_content', N'unknown')),
            CONSTRAINT ck_me_rights_origin_platform CHECK (origin_platform IN (N'antojados', N'explorer', N'tiktok', N'instagram', N'facebook', N'youtube', N'whatsapp', N'camera_roll', N'web', N'unknown')),
            CONSTRAINT ck_me_rights_watermark_policy CHECK (engine_watermark_policy IN (N'apply', N'skip', N'preserve_external', N'admin_review', N'blocked')),
            CONSTRAINT ck_me_rights_ownership CHECK (ownership_type IN (N'company_owned', N'licensed_to_company', N'creator_owned', N'business_owned', N'third_party', N'unknown')),
            CONSTRAINT ck_me_rights_scope CHECK (license_scope IN (N'internal_only', N'platform_public', N'marketing', N'ads', N'all_media', N'unknown')),
            CONSTRAINT ck_me_rights_declaration CHECK (rights_declaration IN (N'i_am_author', N'i_have_permission', N'business_authorized', N'employee_work_product', N'partner_license', N'platform_demo_reference', N'public_but_not_owned', N'unknown')),
            CONSTRAINT ck_me_rights_status CHECK (rights_status IN (N'pending', N'declared', N'approved', N'restricted', N'rejected', N'takedown_requested', N'removed')),
            CONSTRAINT ck_me_rights_license CHECK (license_type IN (N'employee_generated', N'explorer_partner_generated', N'user_generated', N'business_provided', N'licensed', N'demo_only', N'external_unverified', N'unknown'))
        );
    END;

    IF OBJECT_ID(N'me.media_original', N'U') IS NULL
    BEGIN
        CREATE TABLE me.media_original (
            media_original_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_me_media_original PRIMARY KEY,
            media_id UNIQUEIDENTIFIER NOT NULL,
            original_file_name NVARCHAR(260) NULL,
            original_url NVARCHAR(1200) NULL,
            original_storage_path NVARCHAR(1200) NULL,
            mime_type NVARCHAR(120) NOT NULL,
            extension NVARCHAR(20) NULL,
            size_bytes BIGINT NULL,
            width INT NULL,
            height INT NULL,
            duration_ms INT NULL,
            orientation NVARCHAR(30) NULL,
            sha256_hash CHAR(64) NULL,
            exif_json NVARCHAR(MAX) NULL,
            metadata_json NVARCHAR(MAX) NULL,
            created_at DATETIME2(3) NOT NULL CONSTRAINT df_me_original_created DEFAULT SYSUTCDATETIME(),
            CONSTRAINT fk_me_original_request FOREIGN KEY (media_id) REFERENCES me.media_request(media_id)
        );
    END;

    IF OBJECT_ID(N'me.media_variant', N'U') IS NULL
    BEGIN
        CREATE TABLE me.media_variant (
            media_variant_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_me_media_variant PRIMARY KEY,
            media_id UNIQUEIDENTIFIER NOT NULL,
            variant_code NVARCHAR(40) NOT NULL,
            media_type NVARCHAR(20) NOT NULL,
            url NVARCHAR(1200) NOT NULL,
            storage_path NVARCHAR(1200) NULL,
            mime_type NVARCHAR(120) NOT NULL,
            width INT NULL,
            height INT NULL,
            duration_ms INT NULL,
            size_bytes BIGINT NULL,
            aspect_ratio NVARCHAR(20) NULL,
            codec NVARCHAR(80) NULL,
            bitrate_kbps INT NULL,
            fps DECIMAL(6,2) NULL,
            has_watermark BIT NOT NULL CONSTRAINT df_me_variant_watermark DEFAULT 0,
            is_default BIT NOT NULL CONSTRAINT df_me_variant_default DEFAULT 0,
            is_public BIT NOT NULL CONSTRAINT df_me_variant_public DEFAULT 1,
            processing_profile_code NVARCHAR(60) NOT NULL CONSTRAINT df_me_variant_profile DEFAULT N'standard',
            profile_version INT NOT NULL CONSTRAINT df_me_variant_profile_version DEFAULT 1,
            payload_version INT NOT NULL CONSTRAINT df_me_variant_payload_version DEFAULT 3,
            created_at DATETIME2(3) NOT NULL CONSTRAINT df_me_variant_created DEFAULT SYSUTCDATETIME(),
            updated_at DATETIME2(3) NOT NULL CONSTRAINT df_me_variant_updated DEFAULT SYSUTCDATETIME(),
            CONSTRAINT fk_me_variant_request FOREIGN KEY (media_id) REFERENCES me.media_request(media_id),
            CONSTRAINT ck_me_variant_code CHECK (variant_code IN (N'thumb', N'grid', N'feed', N'full', N'story', N'short', N'cover', N'avatar', N'video_preview', N'watermarked', N'feed_video', N'original_safe')),
            CONSTRAINT ck_me_variant_type CHECK (media_type IN (N'image', N'video'))
        );
    END;

    IF OBJECT_ID(N'me.processing_job', N'U') IS NULL
    BEGIN
        CREATE TABLE me.processing_job (
            job_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_me_processing_job PRIMARY KEY,
            media_id UNIQUEIDENTIFIER NOT NULL,
            job_type NVARCHAR(40) NOT NULL,
            status NVARCHAR(30) NOT NULL CONSTRAINT df_me_job_status DEFAULT N'pending',
            priority INT NOT NULL CONSTRAINT df_me_job_priority DEFAULT 100,
            attempts INT NOT NULL CONSTRAINT df_me_job_attempts DEFAULT 0,
            max_attempts INT NOT NULL CONSTRAINT df_me_job_max_attempts DEFAULT 3,
            locked_by NVARCHAR(120) NULL,
            locked_at DATETIME2(3) NULL,
            started_at DATETIME2(3) NULL,
            finished_at DATETIME2(3) NULL,
            error_code NVARCHAR(80) NULL,
            error_message NVARCHAR(2000) NULL,
            created_at DATETIME2(3) NOT NULL CONSTRAINT df_me_job_created DEFAULT SYSUTCDATETIME(),
            updated_at DATETIME2(3) NOT NULL CONSTRAINT df_me_job_updated DEFAULT SYSUTCDATETIME(),
            CONSTRAINT fk_me_job_request FOREIGN KEY (media_id) REFERENCES me.media_request(media_id),
            CONSTRAINT ck_me_job_type CHECK (job_type IN (N'normalize', N'thumbnail', N'compress', N'watermark', N'metadata', N'payload', N'full_pipeline')),
            CONSTRAINT ck_me_job_status CHECK (status IN (N'pending', N'running', N'done', N'failed', N'canceled'))
        );
    END;

    IF OBJECT_ID(N'me.media_event_log', N'U') IS NULL
    BEGIN
        CREATE TABLE me.media_event_log (
            media_event_log_id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_me_event_log PRIMARY KEY,
            media_id UNIQUEIDENTIFIER NULL,
            job_id BIGINT NULL,
            event_code NVARCHAR(80) NOT NULL,
            event_message NVARCHAR(1000) NULL,
            event_json NVARCHAR(MAX) NULL,
            created_at DATETIME2(3) NOT NULL CONSTRAINT df_me_event_created DEFAULT SYSUTCDATETIME()
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT N'03_TABLES_OK' AS install_step;
