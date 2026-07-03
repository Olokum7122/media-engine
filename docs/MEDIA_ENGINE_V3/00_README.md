# ATLX MEDIA ENGINE V3

Version: 3.0.0  
Status: consolidated production baseline  
Scope: AntojadosMX, Android, iOS, Explorer App, Web future, and future ATLX consumers

## Purpose

ATLX Media Engine V3 is the single source of truth for media intake, processing, rights, origin, policy, variants, watermark, moderation readiness, and delivery payloads.

This package consolidates V2 + V2.1 decisions into one baseline so Codex does not have to interpret multiple partial documents.

## Core Rule

The Media Engine owns technical media governance. Antojados owns social/business context.

Media Engine owns:
- intake
- original file record
- metadata
- processing jobs
- variants
- watermark policy
- origin and rights policy
- demo/external restrictions
- ready payload
- audit trail

Antojados owns:
- posts
- users
- sponsors
- feeds
- ranking
- likes
- comments
- cities/metros/locations
- sponsor monetization
- GT analytics context

## Official Flow

```text
Android / iOS / Explorer / Web
        ↓
Media Engine API
        ↓
me.sp_media_request_create
        ↓
me.sp_media_rights_origin_upsert
        ↓
upload/register original
        ↓
processing job
        ↓
policy evaluation
        ↓
variant generation
        ↓
ready payload
        ↓
Antojados consumes media_id + URLs
```

## Non-negotiable Development Rules

- No tenant logic inside the Media Engine.
- No post/feed/ranking logic inside the Media Engine.
- No direct frontend access to `me.*` tables.
- No original-file fallback as public media.
- No removing external platform watermark.
- No double watermark on external platform media by default.
- No marking video as ready without video preview.
- No marking image as ready without public image variant.
- No Android/iOS heavy video processing as final pipeline.
- No `content://` or device-local path as final media URL.

## Package Contents

- `01_ARCHITECTURE_SPEC.md`
- `02_DATA_MODEL_SPEC.md`
- `03_PROCESSING_PIPELINE_SPEC.md`
- `04_RIGHTS_ORIGIN_POLICY_SPEC.md`
- `05_CLIENT_CONSUMPTION_SPEC.md`
- `06_API_CONTRACT.md`
- `07_DATABASE_CONTRACT.md`
- `08_GUARDRAILS_FOR_CODEX.md`
- `09_DEVELOPER_CHECKLIST.md`
- `10_CHANGELOG.md`
- `sql/ATLX_MEDIA_ENGINE_V3_SSMS.sql`
- `diagrams/pipeline.md`
- `diagrams/state_machine.md`
- `diagrams/processing_flow.md`

## How to Use

1. Copy this full folder into the Media Engine repository.
2. Run `sql/ATLX_MEDIA_ENGINE_V3_SSMS.sql` in SSMS.
3. Give Codex the guardrails before any code task.
4. Build API and workers against the SQL contract.
5. Integrate Antojados only through ready payloads.
