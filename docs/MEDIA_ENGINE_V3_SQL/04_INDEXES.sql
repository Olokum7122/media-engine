/*
ATLX MEDIA ENGINE V3 - 04 INDEXES
Run against ATLX_MediaEngine
Idempotent / No GO
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'me.media_request') AND name = N'ux_me_request_client_ref')
    CREATE UNIQUE INDEX ux_me_request_client_ref ON me.media_request(source_app, client_reference_id) WHERE client_reference_id IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'me.media_request') AND name = N'ix_me_request_status')
    CREATE INDEX ix_me_request_status ON me.media_request(status, created_at);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'me.media_request') AND name = N'ix_me_request_actor')
    CREATE INDEX ix_me_request_actor ON me.media_request(source_actor_type, source_actor_id, created_at DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'me.media_rights_origin') AND name = N'ux_me_rights_origin_media')
    CREATE UNIQUE INDEX ux_me_rights_origin_media ON me.media_rights_origin(media_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'me.media_rights_origin') AND name = N'ix_me_rights_status')
    CREATE INDEX ix_me_rights_status ON me.media_rights_origin(rights_status, origin_type, created_at DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'me.media_original') AND name = N'ix_me_original_media')
    CREATE INDEX ix_me_original_media ON me.media_original(media_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'me.media_original') AND name = N'ix_me_original_hash')
    CREATE INDEX ix_me_original_hash ON me.media_original(sha256_hash) WHERE sha256_hash IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'me.media_variant') AND name = N'ux_me_variant_media_code')
    CREATE UNIQUE INDEX ux_me_variant_media_code ON me.media_variant(media_id, variant_code);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'me.processing_job') AND name = N'ix_me_job_next')
    CREATE INDEX ix_me_job_next ON me.processing_job(status, priority, created_at) INCLUDE (media_id, attempts, max_attempts);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'me.processing_job') AND name = N'ix_me_job_media')
    CREATE INDEX ix_me_job_media ON me.processing_job(media_id, created_at DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'me.media_event_log') AND name = N'ix_me_event_media')
    CREATE INDEX ix_me_event_media ON me.media_event_log(media_id, created_at DESC);

SELECT N'04_INDEXES_OK' AS install_step;
