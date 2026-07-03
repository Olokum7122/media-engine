# 07 - DATABASE CONTRACT

## 1. SQL Rules

- SQL Server.
- Schema `me`.
- Idempotent scripts.
- No `GO`.
- Stored procedures created through `EXEC('CREATE OR ALTER PROCEDURE ...')`.
- No destructive migrations without explicit approval.
- Additive changes only unless version changes.

## 2. Public Stored Procedures

- `me.sp_media_request_create`
- `me.sp_media_rights_origin_upsert`
- `me.sp_media_rights_origin_get`
- `me.sp_media_rights_policy_evaluate`
- `me.sp_media_original_register`
- `me.sp_media_get_by_id`
- `me.sp_media_get_ready_payload`
- `me.sp_media_cancel`

## 3. Worker Stored Procedures

- `me.sp_media_job_pick_next`
- `me.sp_media_job_mark_running`
- `me.sp_media_variant_upsert`
- `me.sp_media_mark_ready`
- `me.sp_media_mark_failed`
- `me.sp_media_mark_rejected`

## 4. Public Views

- `me.v_media_ready_payload`
- `me.v_media_request_summary`

## 5. Ready Contract

`sp_media_get_ready_payload` must not return final URLs unless media is ready.

## 6. Compatibility Rules

Allowed:
- Add nullable columns.
- Add new catalogs.
- Add new SPs.
- Add new optional params at end.

Forbidden:
- Rename public columns.
- Rename public SPs.
- Remove official codes.
- Change semantic meaning.
- Add tenant/post/ranking logic.
