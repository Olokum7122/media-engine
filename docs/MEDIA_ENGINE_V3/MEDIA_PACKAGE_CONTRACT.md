# Media Package Contract — Engine V3 → Clients

Version: 1.0.0
Status: active
Applies to: Android, iOS, Explorer App, Web, Antojados API

## 1. Purpose

Defines the formal delivery format (Media Package) that Media Engine V3
produces and all downstream clients consume. This contract replaces ad-hoc
payload parsing with a typed, versioned, and documented artifact.

## 2. The Media Package

Every media processed by the Engine is delivered as a **MediaPackage**:

```typescript
interface MediaPackage {
  /** Engine-assigned media identifier (UUID v4). Maps to media_intake_id in apps. */
  mediaId: string

  /** Package format version. Clients MUST validate compatibility. */
  version: '1.0'

  /**
   * Processing status. Clients consume ONLY 'ready' payloads.
   * - 'processing': Engine is generating variants. Poll again.
   * - 'ready': All required variants exist. Payload is complete.
   * - 'failed': Processing error. Check error_msg.
   * - 'rejected': Rights/policy violation. Media cannot be published.
   * - 'canceled': User or system canceled the request.
   */
  status: 'processing' | 'ready' | 'failed' | 'rejected' | 'canceled'

  /** Error message when status is 'failed' or 'rejected'. */
  error_msg: string | null

  /** The media payload with all generated variants. null when not ready. */
  payload: MediaPayload | null
}
```

## 3. Media Payload

The `MediaPayload` contains all generated variants plus metadata:

```typescript
interface MediaPayload {
  // ── Identity ──
  /** Product/request code from upstream system */
  productCode: string
  /** Resolved media type */
  mediaType: 'image' | 'video'
  /** Detected orientation: 'landscape' | 'portrait' | 'square' | null */
  orientation: string | null
  /** Original width in pixels */
  width: number
  /** Original height in pixels */
  height: number
  /** MIME type of the original file */
  mimeType: string

  // ── Image Variants ──
  /** 320x320 center crop — thumbnails, avatars, pre-listeners */
  thumbUrl: string | null
  /** 600x600 center crop — grid layouts, masonry cells */
  gridUrl: string | null
  /** 1080x1350 crop safe — feed cards, social scroll (S1/S2) */
  feedUrl: string | null
  /** Max 1440 long side — fullscreen, detail view (S3) */
  fullUrl: string | null
  /** 1080x1920 crop safe — story/highlight format */
  storyUrl: string | null
  /** 1080x608 crop safe — business cover, tile background */
  coverUrl: string | null
  /** 512x512 center crop — user/explorer avatar */
  avatarUrl: string | null
  /** Public URL of the original file (NOT for client consumption) */
  originalUrl: string | null

  // ── Video Variants ──
  /** 720p MP4 H.264/AAC — primary feed playback */
  videoUrl: string | null
  /** 1080p MP4 H.264/AAC — fullscreen, high quality */
  video1080Url: string | null
  /** 1080x1920 portrait MP4 — short-form vertical video */
  shortUrl: string | null
  /** 1080x1350 or 1080x1920 MP4 — flexible feed video */
  feedVideoUrl: string | null
  /** 1080x1920 portrait MP4 — story format video */
  storyVideoUrl: string | null
  /** 720x1280 image preview — video thumbnail before playback */
  videoPreviewUrl: string | null

  // ── Video Metadata ──
  /** Duration in milliseconds (null for images) */
  durationMs: number | null
  /** Aspect ratio string (e.g., '16:9', '4:3', '9:16') */
  aspectRatio: string | null

  // ── Rights & Origin ──
  /** Origin type: 'created_in_antojados' | 'explorer_partner' | 'external_platform' | 'official_antojados' | 'employee_generated' */
  originType: string
  /** Rights status: 'declared' | 'approved' | 'restricted' | 'takedown' */
  rightsStatus: string
  /** Whether this is demo/sample content */
  isDemoContent: boolean

  // ── Delivery ──
  /** Payload format version for forward compatibility */
  payloadVersion: string
  /** ISO 8601 timestamp when variants were completed */
  readyAt: string
}
```

## 4. Field Mapping by Destination

### 4.1 Android / iOS

| Context | Primary field | Fallback |
|---|---|---|
| Gallery grid (S1) | `gridUrl` | `thumbUrl` |
| Feed card (S2) | `feedUrl` | `gridUrl` → `thumbUrl` |
| Fullscreen image (S3) | `fullUrl` | `feedUrl` |
| Story / highlight | `storyUrl` | `fullUrl` |
| Avatar | `avatarUrl` | `thumbUrl` |
| Cover / tile | `coverUrl` | `feedUrl` |
| Video feed playback | `videoUrl` | — |
| Video fullscreen | `video1080Url` | `videoUrl` |
| Video preview (thumbnail) | `videoPreviewUrl` | `thumbUrl` |
| Short / Reels | `shortUrl` | `videoUrl` |

### 4.2 Explorer App

| Context | Primary field | Fallback |
|---|---|---|
| Editor preview | `feedUrl` | `fullUrl` |
| Published feed card | `feedUrl` | `fullUrl` |
| Fullscreen detail | `fullUrl` | `feedUrl` |
| Thumbnail library | `thumbUrl` | `feedUrl` |

### 4.3 Antojados API (Gateway persisted)

| DB column | Payload field |
|---|---|
| `media_url` | `feedUrl` (images) / `videoUrl` (video) |
| `media_thumbnail_url` | `thumbUrl` |
| `media_full_url` | `fullUrl` |
| `video_720_url` | `videoUrl` |
| `video_1080_url` | `video1080Url` |

## 5. Ready Rules

An image payload is **ready** when:
- Original exists
- At least one public image variant exists (`thumbUrl`, `gridUrl`, or `feedUrl`)

A video payload is **ready** when:
- Original exists
- Public video variant exists (`videoUrl` or `feedVideoUrl`)
- `videoPreviewUrl` exists

## 6. URL Format

All URLs follow the pattern:

```
/media/{yyyy}/{mm}/{media_id}/{variant}.{ext}
```

Where:
- `{yyyy}`: 4-digit year of processing
- `{mm}`: 2-digit month of processing
- `{media_id}`: UUID v4 assigned by Engine
- `{variant}`: one of `thumb`, `grid`, `feed`, `full`, `story`, `cover`, `avatar`, `original`, `video`, `video_1080`, `short`, `feed_video`, `story_video`, `video_preview`
- `{ext}`: `jpg` (image), `mp4` (video)

**Public base URL**: `https://api.antojadosmx.mx`

Clients MUST normalize Engine-relative URLs using `normalize-media.ts`
(or equivalent) before rendering.

## 7. Versioning

The `MediaPackage.version` field follows semver:

- **Major**: Breaking change to payload structure (new required fields, removed fields)
- **Minor**: New optional fields added

Clients MUST:
1. Validate `version` before consuming
2. Reject packages with unsupported major versions
3. Ignore unknown fields for forward compatibility

## 8. Example: Image Ready Payload

```json
{
  "mediaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "version": "1.0",
  "status": "ready",
  "error_msg": null,
  "payload": {
    "productCode": "antojados-biz-001",
    "mediaType": "image",
    "orientation": "landscape",
    "width": 4032,
    "height": 3024,
    "mimeType": "image/jpeg",
    "thumbUrl": "https://api.antojadosmx.mx/media/2026/07/a1b2c3d4/thumb.jpg",
    "gridUrl": "https://api.antojadosmx.mx/media/2026/07/a1b2c3d4/grid.jpg",
    "feedUrl": "https://api.antojadosmx.mx/media/2026/07/a1b2c3d4/feed.jpg",
    "fullUrl": "https://api.antojadosmx.mx/media/2026/07/a1b2c3d4/full.jpg",
    "storyUrl": null,
    "coverUrl": null,
    "avatarUrl": null,
    "originalUrl": "https://api.antojadosmx.mx/media/2026/07/a1b2c3d4/original.jpg",
    "videoUrl": null,
    "video1080Url": null,
    "shortUrl": null,
    "feedVideoUrl": null,
    "storyVideoUrl": null,
    "videoPreviewUrl": null,
    "durationMs": null,
    "aspectRatio": "4:3",
    "originType": "created_in_antojados",
    "rightsStatus": "approved",
    "isDemoContent": false,
    "payloadVersion": "1.0",
    "readyAt": "2026-07-15T14:30:00.000Z"
  }
}
```

## 9. Example: Video Ready Payload

```json
{
  "mediaId": "f6e5d4c3-b2a1-0987-fedc-ba9876543210",
  "version": "1.0",
  "status": "ready",
  "error_msg": null,
  "payload": {
    "productCode": "antojados-explorer-002",
    "mediaType": "video",
    "orientation": "portrait",
    "width": 1080,
    "height": 1920,
    "mimeType": "video/mp4",
    "thumbUrl": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/thumb.jpg",
    "gridUrl": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/grid.jpg",
    "feedUrl": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/feed.jpg",
    "fullUrl": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/full.jpg",
    "storyUrl": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/story.jpg",
    "coverUrl": null,
    "avatarUrl": null,
    "originalUrl": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/original.mp4",
    "videoUrl": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/video.mp4",
    "video1080Url": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/video_1080.mp4",
    "shortUrl": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/short.mp4",
    "feedVideoUrl": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/feed_video.mp4",
    "storyVideoUrl": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/story_video.mp4",
    "videoPreviewUrl": "https://api.antojadosmx.mx/media/2026/07/f6e5d4c3/video_preview.jpg",
    "durationMs": 45000,
    "aspectRatio": "9:16",
    "originType": "explorer_partner",
    "rightsStatus": "approved",
    "isDemoContent": false,
    "payloadVersion": "1.0",
    "readyAt": "2026-07-15T14:35:00.000Z"
  }
}
```

## 10. Client Integration Checklist

- [ ] Validate `MediaPackage.version` before consuming
- [ ] Consume only `payload` when `status === 'ready'`
- [ ] Use correct variant for context (see §4 field mapping)
- [ ] Never use `originalUrl` as final display media
- [ ] Normalize all URLs through `normalize-media.ts`
- [ ] Handle `null` variants gracefully (fallback chain)
- [ ] Show demo label when `isDemoContent === true`
- [ ] Preserve attribution when `originType === 'external_platform'`

## 11. History

| Version | Date | Change |
|---|---|---|
| 1.0.0 | [FECHA_ACTUAL] | Initial contract. Formal MediaPackage definition with all Engine V3 variants |
