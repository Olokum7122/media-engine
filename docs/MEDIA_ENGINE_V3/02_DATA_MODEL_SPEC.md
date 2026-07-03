# 02 - DATA MODEL SPEC

## 1. Schema

All engine objects live in schema:

```sql
me
```

## 2. Primary Tables

### me.media_request

Root entity for one media item.

Important fields:
- `media_id`
- `source_app`
- `source_actor_type`
- `source_actor_id`
- `target_context`
- `external_context_id`
- `client_reference_id`
- `media_type`
- `processing_profile_code`
- `watermark_profile_code`
- `status`
- `ready_payload_json`
- `payload_version`

### me.media_rights_origin

Origin, ownership, license, watermark and policy information.

Important fields:
- `origin_type`
- `origin_platform`
- `ownership_type`
- `employment_generated`
- `license_scope`
- `rights_declaration`
- `rights_status`
- `license_type`
- `is_demo_content`
- `allow_public_display`
- `allow_download`
- `allow_share`
- `allow_engine_watermark`

### me.media_original

Original uploaded media record.

Important fields:
- `original_url`
- `original_storage_path`
- `mime_type`
- `extension`
- `size_bytes`
- `width`
- `height`
- `duration_ms`
- `sha256_hash`

### me.media_variant

Processed media output.

Important fields:
- `variant_code`
- `media_type`
- `url`
- `storage_path`
- `mime_type`
- `width`
- `height`
- `duration_ms`
- `aspect_ratio`
- `has_watermark`
- `is_public`

### me.processing_job

Worker queue.

Important fields:
- `job_type`
- `status`
- `priority`
- `attempts`
- `locked_by`
- `error_code`
- `error_message`

## 3. Catalog Tables

- `me.media_status_catalog`
- `me.media_variant_catalog`
- `me.media_error_catalog`
- `me.processing_profile`
- `me.watermark_profile`

## 4. Official Codes

### source_app

- android
- ios
- explorer
- web
- admin
- worker

### source_actor_type

- user
- sponsor
- explorer
- employee
- admin
- system

### media_type

- image
- video

### target_context

- post
- short
- pachanga
- profile
- sponsor
- event
- promo
- cover
- avatar
- story
- gallery
- fullscreen

### media_request.status

- received
- uploading
- uploaded
- queued
- processing
- ready
- failed
- rejected
- canceled
- expired

### origin_type

- official_antojados
- explorer_partner
- created_in_antojados
- uploaded_by_owner
- licensed_content
- external_platform
- demo_content
- unknown

### ownership_type

- company_owned
- licensed_to_company
- creator_owned
- business_owned
- third_party
- unknown

### engine_watermark_policy

- apply
- skip
- preserve_external
- admin_review
- blocked

### rights_status

- pending
- declared
- approved
- restricted
- rejected
- takedown_requested
- removed

## 5. Required Indexes

- unique `(source_app, client_reference_id)` filtered
- `media_request(status, created_at)`
- `media_request(source_actor_type, source_actor_id, created_at)`
- unique `media_rights_origin(media_id)`
- `media_rights_origin(rights_status, origin_type, created_at)`
- `media_original(media_id)`
- `media_original(sha256_hash)` filtered
- unique `media_variant(media_id, variant_code)`
- `processing_job(status, priority, created_at)`
- `processing_job(media_id, created_at)`
- `media_event_log(media_id, created_at)`

## 6. Views

### me.v_media_ready_payload

Public-ready payload view.

### me.v_media_request_summary

Operational summary view.
