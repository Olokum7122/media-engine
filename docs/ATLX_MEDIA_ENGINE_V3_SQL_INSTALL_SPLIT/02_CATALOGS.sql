/*
ATLX MEDIA ENGINE V3 - 02 CATALOG TABLES
Run against ATLX_MediaEngine
Idempotent / No GO
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'me.media_status_catalog', N'U') IS NULL
    BEGIN
        CREATE TABLE me.media_status_catalog (
            status_code NVARCHAR(30) NOT NULL CONSTRAINT pk_me_media_status_catalog PRIMARY KEY,
            display_name NVARCHAR(120) NOT NULL,
            is_terminal BIT NOT NULL CONSTRAINT df_me_status_terminal DEFAULT 0,
            sort_order INT NOT NULL CONSTRAINT df_me_status_sort DEFAULT 100,
            is_active BIT NOT NULL CONSTRAINT df_me_status_active DEFAULT 1,
            created_at DATETIME2(3) NOT NULL CONSTRAINT df_me_status_created DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID(N'me.media_variant_catalog', N'U') IS NULL
    BEGIN
        CREATE TABLE me.media_variant_catalog (
            variant_code NVARCHAR(40) NOT NULL CONSTRAINT pk_me_media_variant_catalog PRIMARY KEY,
            display_name NVARCHAR(120) NOT NULL,
            media_type NVARCHAR(20) NOT NULL,
            target_width INT NULL,
            target_height INT NULL,
            is_public BIT NOT NULL CONSTRAINT df_me_variant_catalog_public DEFAULT 1,
            is_required_for_image BIT NOT NULL CONSTRAINT df_me_variant_req_img DEFAULT 0,
            is_required_for_video BIT NOT NULL CONSTRAINT df_me_variant_req_vid DEFAULT 0,
            sort_order INT NOT NULL CONSTRAINT df_me_variant_sort DEFAULT 100,
            is_active BIT NOT NULL CONSTRAINT df_me_variant_active DEFAULT 1,
            created_at DATETIME2(3) NOT NULL CONSTRAINT df_me_variant_created DEFAULT SYSUTCDATETIME(),
            CONSTRAINT ck_me_variant_catalog_type CHECK (media_type IN (N'image', N'video', N'both'))
        );
    END;

    IF OBJECT_ID(N'me.media_error_catalog', N'U') IS NULL
    BEGIN
        CREATE TABLE me.media_error_catalog (
            error_code NVARCHAR(80) NOT NULL CONSTRAINT pk_me_media_error_catalog PRIMARY KEY,
            display_name NVARCHAR(160) NOT NULL,
            client_message NVARCHAR(500) NULL,
            is_retryable BIT NOT NULL CONSTRAINT df_me_error_retry DEFAULT 0,
            is_active BIT NOT NULL CONSTRAINT df_me_error_active DEFAULT 1,
            created_at DATETIME2(3) NOT NULL CONSTRAINT df_me_error_created DEFAULT SYSUTCDATETIME()
        );
    END;

    IF OBJECT_ID(N'me.processing_profile', N'U') IS NULL
    BEGIN
        CREATE TABLE me.processing_profile (
            processing_profile_code NVARCHAR(60) NOT NULL,
            profile_version INT NOT NULL,
            display_name NVARCHAR(120) NOT NULL,
            rules_json NVARCHAR(MAX) NULL,
            is_active BIT NOT NULL CONSTRAINT df_me_profile_active DEFAULT 1,
            created_at DATETIME2(3) NOT NULL CONSTRAINT df_me_profile_created DEFAULT SYSUTCDATETIME(),
            updated_at DATETIME2(3) NOT NULL CONSTRAINT df_me_profile_updated DEFAULT SYSUTCDATETIME(),
            CONSTRAINT pk_me_processing_profile PRIMARY KEY (processing_profile_code, profile_version)
        );
    END;

    IF OBJECT_ID(N'me.watermark_profile', N'U') IS NULL
    BEGIN
        CREATE TABLE me.watermark_profile (
            watermark_profile_code NVARCHAR(60) NOT NULL CONSTRAINT pk_me_watermark_profile PRIMARY KEY,
            display_name NVARCHAR(120) NOT NULL,
            logo_url NVARCHAR(1200) NULL,
            logo_storage_path NVARCHAR(1200) NULL,
            position_code NVARCHAR(40) NOT NULL CONSTRAINT df_me_watermark_position DEFAULT N'bottom_right',
            opacity DECIMAL(5,2) NOT NULL CONSTRAINT df_me_watermark_opacity DEFAULT 0.70,
            margin_px INT NOT NULL CONSTRAINT df_me_watermark_margin DEFAULT 32,
            max_width_percent DECIMAL(5,2) NOT NULL CONSTRAINT df_me_watermark_width DEFAULT 18.00,
            is_active BIT NOT NULL CONSTRAINT df_me_watermark_active DEFAULT 1,
            created_at DATETIME2(3) NOT NULL CONSTRAINT df_me_watermark_created DEFAULT SYSUTCDATETIME(),
            updated_at DATETIME2(3) NOT NULL CONSTRAINT df_me_watermark_updated DEFAULT SYSUTCDATETIME(),
            CONSTRAINT ck_me_watermark_position CHECK (position_code IN (N'none', N'top_left', N'top_right', N'bottom_left', N'bottom_right', N'center'))
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT N'02_CATALOGS_OK' AS install_step;
