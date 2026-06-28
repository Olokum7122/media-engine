# 06 - API CONTRACT

## 1. Principle

The API is a thin contract layer over stored procedures. It must not create hidden business rules that conflict with SQL contracts.

## 2. Endpoints

### POST /api/media/requests

Creates media request.

### POST /api/media/{mediaId}/rights-origin

Registers rights and origin.

### POST /api/media/{mediaId}/original

Registers original media.

### GET /api/media/{mediaId}

Diagnostics.

### GET /api/media/{mediaId}/ready-payload

Returns public ready payload.

### GET /api/media/{mediaId}/policy

Returns rights policy evaluation.

### POST /api/media/{mediaId}/cancel

Cancels pending media.

### Worker-only

- POST /api/media/worker/jobs/next
- POST /api/media/worker/jobs/{jobId}/variant
- POST /api/media/worker/jobs/{jobId}/ready
- POST /api/media/worker/jobs/{jobId}/failed
- POST /api/media/worker/jobs/{jobId}/rejected

## 3. Security Roles

- `media.client`
- `media.explorer`
- `media.worker`
- `media.admin`

Only worker/admin can mark media ready.

## 4. Idempotency

Use `clientReferenceId`. Same source app + same client reference must return same media id.

## 5. Response When Not Ready

```json
{
  "mediaId": "uuid",
  "status": "processing",
  "ready": false,
  "payload": null
}
```

## 6. Response When Ready

```json
{
  "mediaId": "uuid",
  "status": "ready",
  "ready": true,
  "payload": {
    "thumbUrl": "...",
    "gridUrl": "...",
    "feedUrl": "...",
    "fullUrl": "...",
    "coverUrl": "...",
    "videoUrl": "...",
    "videoPreviewUrl": "...",
    "originType": "official_antojados",
    "rightsStatus": "approved",
    "isDemoContent": false
  }
}
```
