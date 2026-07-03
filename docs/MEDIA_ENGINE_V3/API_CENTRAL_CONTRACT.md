# API Central Contract — Ecosistema AntojadosMX

Version: 1.0.0
Status: active
Applies to: Api_getaway_antojadosmx, Media Engine V3, Antojados Apps, Explorer App

## 1. Purpose

Defines the interaction contract between the API Gateway (`Api_getaway_antojadosmx`),
Media Engine V3 (`media-engine`), and all downstream client applications
(Antojados Android/iOS, Explorer App).

This document answers: **How do requests flow through the ecosystem?**
It complements `02g_MEDIA_ENGINE_INTEGRATION_CONTRACT.md` (client→Engine)
and `MEDIA_PACKAGE_CONTRACT.md` (Engine→client delivery format).

## 2. Architecture Overview

```
┌──────────────────────┐     ┌──────────────────────────────┐
│   Client Apps        │     │   API Gateway                │
│   (Android/iOS/      │     │   (port 8010)                │
│    Explorer/Web)     │     │                              │
│                      │     │  /api/v1/antojados/*         │
│  VITE_API_URL ───────┼────>│  /api/media/* (proxy) ──────┼──> Engine (4100)
│  = api.antojadosmx.mx│     │                              │
└──────────────────────┘     └──────────┬───────────────────┘
                                        │
                                        ▼
                              ┌──────────────────────┐
                              │   SQL Server DB       │
                              │   (antojados_core)    │
                              └──────────────────────┘
```

## 3. Request Routing

### 3.1 Base URL

All clients use a single base URL:
```
https://api.antojadosmx.mx
```

This is configured via `VITE_API_URL` (or equivalent env variable).

### 3.2 Gateway routes

| Path prefix | Target | Handler |
|---|---|---|
| `/api/v1/antojados/*` | Gateway business logic | Express routes + SQL Server |
| `/api/media/*` | Media Engine (via proxy) | `http://localhost:4100` |
| `/health` | Gateway health check | Express route |
| `/docs` | Swagger UI | Static |

### 3.3 Media Engine routes (via proxy)

The Gateway proxies `/api/media/*` to the Media Engine. Clients do NOT
call the Engine directly in production. All Engine endpoints are prefixed
with `/api/media`:

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/media/requests` | Create media processing request |
| GET | `/api/media/{mediaId}` | Get request status |
| POST | `/api/media/{mediaId}/rights-origin` | Register rights and origin |
| POST | `/api/media/{mediaId}/original` | Upload original file (multipart) |
| GET | `/api/media/{mediaId}/ready-payload` | Get processed URLs (polling) |
| GET | `/api/media/{mediaId}/policy` | Evaluate policy |
| POST | `/api/media/{mediaId}/cancel` | Cancel pending request |

## 4. Complete Media Flow

### 4.1 Upload → Publish Flow

```
Client                        Gateway                     Engine
  │                              │                          │
  │  1. POST /api/media/requests ──proxy──>                  │
  │                              │        POST /api/media/   │
  │                              │        requests           │
  │                              │                          │
  │  <── { mediaId } ──────proxy────                        │
  │                              │                          │
  │  2. POST /api/media/{id}/    ──proxy──>                  │
  │     rights-origin             │        POST /api/media/  │
  │                              │        {id}/rights-origin │
  │                              │                          │
  │  3. POST /api/media/{id}/    ──proxy──>                  │
  │     original (multipart)     │        POST /api/media/   │
  │                              │        {id}/original      │
  │                              │                          │
  │  4. GET /api/media/{id}/     ──proxy──> (polling)        │
  │     ready-payload            │        GET /api/media/    │
  │                              │        {id}/ready-payload │
  │  <── { status: "ready",     ──proxy────                 │
  │        payload: { ... } }                                │
  │                              │                          │
  │  5. POST /api/v1/antojados/  │                          │
  │     posts/create              │                          │
  │     { media_intake_id: id,   │                          │
  │       ... }                   │                          │
  │                              │                          │
  │                              │  6. resolvePostMediaFrom- │
  │                              │     Intake(mediaId)       │
  │                              │     → SELECT FROM         │
  │                              │       me_media_assets     │
  │                              │     → Resuelve URLs       │
  │                              │     → Crea post en DB     │
  │                              │                          │
  │  <── { post_id, ... } ──────                             │
```

### 4.2 Feed Consumption Flow

```
Client                        Gateway
  │                              │
  │  GET /api/v1/antojados/      │
  │  biz/feed?city_code=...      │
  │  (o social/feed)             │
  │                              │
  │                              │  SQL: SELECT FROM
  │                              │  feed_biz_items / soc_posts
  │                              │  JOIN biz_posts / soc_posts
  │                              │
  │  <── [{ media_url,           │
  │         media_thumbnail_url, │
  │         media_full_url,      │
  │         video_720_url,       │
  │         video_1080_url,      │
  │         ... }]               │
  │                              │
  │  normalizeMediaUrl(url)      │
  │  → Resuelve dominio público  │
  │                              │
  │  Render segun variante       │
  │  (thumb/grid/feed/full/      │
  │   video/video_preview)       │
```

## 5. URL Resolution

### 5.1 When publishing (Gateway-side)

The Gateway's `resolvePostMediaFromIntake()` function resolves Engine URLs:

```sql
SELECT 
  ma.thumb_url,
  ma.grid_url,
  ma.feed_url,
  ma.full_url,
  ma.video_url,
  ma.video_1080_url,
  ma.video_preview_url
FROM antojados_core.soc_media_intake mi
JOIN antojados_core.me_media_assets ma 
  ON ma.media_id = mi.media_intake_id
WHERE mi.media_intake_id = @intakeId
  AND mi.status = 'done'
  AND mi.entity_id = @postId
```

The Gateway then persists:
- `media_url` → `feedUrl` (images) or `videoUrl` (video)
- `media_thumbnail_url` → `thumbUrl`
- `media_full_url` → `fullUrl`
- `video_720_url` → `videoUrl`
- `video_1080_url` → `video1080Url`

### 5.2 When consuming (Client-side)

Clients normalize Engine-relative URLs using `normalize-media.ts`:

```typescript
// Pattern: /media/{yyyy}/{mm}/{id}/{variant}.ext
// → https://api.antojadosmx.mx/media/{yyyy}/{mm}/{id}/{variant}.ext

// Pattern: /uploads/{filename}
// → https://api.antojadosmx.mx/uploads/{filename}

// Pattern: legacy http://localhost:4100/...
// → https://api.antojadosmx.mx/...
```

## 6. Error Propagation

### 6.1 Media Engine errors (via proxy)

Engine errors are propagated as-is through the Gateway proxy:

```json
{
  "error": "media_not_found",
  "message": "Media with id xyz not found",
  "status": 404
}
```

### 6.2 Gateway business logic errors

```json
{
  "error": "intake_not_ready",
  "message": "El media intake aun no esta listo. Espera a que termine el procesamiento.",
  "intake_id": "abc-123",
  "status": 409
}
```

### 6.3 Client-side error mapping

Clients should use `media-error-map.ts` to translate technical errors to
user-friendly messages in Spanish. See `03c_PUBLISH_SYSTEM.md` §DEBT-016.

## 7. Environment Configuration

### 7.1 Development

```env
# Gateway
PORT=8010
MEDIA_ENGINE_URL=http://localhost:4100

# Clients
VITE_API_URL=http://localhost:8010
```

### 7.2 Production

```env
# Gateway
PORT=8010
MEDIA_ENGINE_URL=http://localhost:4100  # internal Docker network

# Clients
VITE_API_URL=https://api.antojadosmx.mx
```

## 8. Security

- `/api/media/*` is proxied but NOT exposed to public internet directly.
  Only the Gateway port (8010) is publicly accessible.
- Media Engine (4100) is internal-only, reachable via Docker network or localhost.
- File upload size limit: 500MB (Engine), 20MB/200MB (client-side validation).
- All Engine requests from clients must authenticate via Gateway session.

## 9. History

| Version | Date | Change |
|---|---|---|
| 1.0.0 | [FECHA_ACTUAL] | Initial contract. Gateway ↔ Engine ↔ Apps routing and flow |
