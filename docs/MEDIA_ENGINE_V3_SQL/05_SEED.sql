/*
ATLX MEDIA ENGINE V3 - 05 SEED CATALOGS
Run against ATLX_MediaEngine
Idempotent / No GO
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM me.media_status_catalog WHERE status_code = N'received')
    BEGIN
        INSERT INTO me.media_status_catalog (status_code, display_name, is_terminal, sort_order) VALUES
        (N'received', N'Received', 0, 10),
        (N'uploading', N'Uploading', 0, 20),
        (N'uploaded', N'Uploaded', 0, 30),
        (N'queued', N'Queued', 0, 40),
        (N'processing', N'Processing', 0, 50),
        (N'ready', N'Ready', 1, 60),
        (N'failed', N'Failed', 1, 70),
        (N'rejected', N'Rejected', 1, 80),
        (N'canceled', N'Canceled', 1, 90),
        (N'expired', N'Expired', 1, 100);
    END;

    IF NOT EXISTS (SELECT 1 FROM me.media_variant_catalog WHERE variant_code = N'thumb')
    BEGIN
        INSERT INTO me.media_variant_catalog (variant_code, display_name, media_type, target_width, target_height, is_required_for_image, is_required_for_video, sort_order) VALUES
        (N'thumb', N'Thumbnail', N'image', 320, 320, 1, 0, 10),
        (N'grid', N'Grid', N'image', 600, 600, 1, 0, 20),
        (N'feed', N'Feed Image', N'image', 1080, 1350, 1, 0, 30),
        (N'full', N'Full Image', N'image', 1440, NULL, 0, 0, 40),
        (N'story', N'Story', N'both', 1080, 1920, 0, 0, 50),
        (N'short', N'Short Video', N'video', 1080, 1920, 0, 1, 60),
        (N'cover', N'Cover', N'image', 1080, 608, 0, 0, 70),
        (N'avatar', N'Avatar', N'image', 512, 512, 0, 0, 80),
        (N'video_preview', N'Video Preview', N'image', 720, 1280, 0, 1, 90),
        (N'watermarked', N'Watermarked', N'both', NULL, NULL, 0, 0, 100),
        (N'feed_video', N'Feed Video', N'video', 1080, 1350, 0, 0, 110),
        (N'original_safe', N'Original Safe', N'both', NULL, NULL, 0, 0, 120);
    END;

    IF NOT EXISTS (SELECT 1 FROM me.media_error_catalog WHERE error_code = N'MEDIA_NOT_FOUND')
    BEGIN
        INSERT INTO me.media_error_catalog (error_code, display_name, client_message, is_retryable) VALUES
        (N'MEDIA_NOT_FOUND', N'Media not found', N'No se encontro la media.', 0),
        (N'INVALID_STATUS', N'Invalid status', N'Estado invalido.', 0),
        (N'INVALID_MEDIA_TYPE', N'Invalid media type', N'Tipo de media invalido.', 0),
        (N'ORIGINAL_NOT_REGISTERED', N'Original not registered', N'No se registro archivo original.', 1),
        (N'VARIANT_REQUIRED', N'Variant required', N'Faltan variantes requeridas.', 1),
        (N'VIDEO_PREVIEW_REQUIRED', N'Video preview required', N'Falta portada del video.', 1),
        (N'PROCESSING_FAILED', N'Processing failed', N'Fallo el procesamiento.', 1),
        (N'RIGHTS_BLOCKED', N'Rights blocked', N'La politica de derechos bloquea el uso.', 0),
        (N'RIGHTS_ORIGIN_REQUIRED', N'Rights origin required', N'Falta registrar origen y derechos.', 0),
        (N'MEDIA_REJECTED', N'Media rejected', N'Media rechazada.', 0),
        (N'MEDIA_CANCELED', N'Media canceled', N'Media cancelada.', 0);
    END;

    IF NOT EXISTS (SELECT 1 FROM me.processing_profile WHERE processing_profile_code = N'standard' AND profile_version = 1)
    BEGIN
        INSERT INTO me.processing_profile (processing_profile_code, profile_version, display_name, rules_json) VALUES
        (N'standard', 1, N'Standard', N'{"image":{"thumb":"320x320","grid":"600x600","feed":"1080x1350","full":"1440_long"},"video":{"short":"1080x1920","fpsMax":30,"codec":"h264","audio":"aac"}}'),
        (N'explorer_high', 1, N'Explorer High', N'{"image":{"quality":88},"video":{"bitrate":"4500k","fpsMax":30},"watermark":"policy_based"}'),
        (N'mobile_fast', 1, N'Mobile Fast', N'{"image":{"quality":78},"video":{"bitrate":"2500k","fpsMax":30}}');
    END;

    IF NOT EXISTS (SELECT 1 FROM me.watermark_profile WHERE watermark_profile_code = N'none')
    BEGIN
        INSERT INTO me.watermark_profile (watermark_profile_code, display_name, position_code, opacity, margin_px, max_width_percent, is_active) VALUES
        (N'none', N'No Watermark', N'none', 0.00, 0, 0.00, 1),
        (N'antojados_default', N'Antojados Default', N'bottom_right', 0.70, 32, 18.00, 1),
        (N'official_antojados', N'Official Antojados', N'bottom_right', 0.75, 32, 18.00, 1),
        (N'sponsor_light', N'Sponsor Light', N'bottom_right', 0.55, 32, 15.00, 1);
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT N'05_SEED_OK' AS install_step;
