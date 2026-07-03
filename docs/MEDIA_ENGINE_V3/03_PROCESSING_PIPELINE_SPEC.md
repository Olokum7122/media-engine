# 03 - PROCESSING PIPELINE SPEC

## 1. Pipeline

```text
request_created
  ↓
rights_origin_registered
  ↓
original_registered
  ↓
job_queued
  ↓
policy_evaluated
  ↓
metadata_extracted
  ↓
variants_generated
  ↓
payload_built
  ↓
ready
```

## 2. Image Processing

Required:
- EXIF orientation correction.
- Sensitive metadata stripping.
- SHA-256 hash.
- Width/height extraction.
- Aspect ratio calculation.
- Standard variants.

Official image variants:
- `thumb`: 320x320 center crop.
- `grid`: 600x600 center crop.
- `feed`: 1080x1350 crop safe.
- `full`: max 1440 long side.
- `story`: 1080x1920 crop safe.
- `cover`: 1080x608 crop safe.
- `avatar`: 512x512 center crop.

## 3. Video Processing

Required:
- Duration extraction.
- Width/height extraction.
- Thumbnail generation.
- Public video variant generation.
- MP4 H.264/AAC output.
- FPS max 30.
- Policy-based watermark.

Official video variants:
- `short`: 1080x1920.
- `feed_video`: 1080x1350 or 1080x1920.
- `story`: 1080x1920.
- `video_preview`: image preview, 720x1280.

## 4. Ready Rules

Image can be ready only when:
- original exists;
- at least one public image variant exists;
- `thumb`, `grid`, or `feed` exists.

Video can be ready only when:
- original exists;
- public video variant exists;
- `video_preview` exists.

## 5. Storage Naming

```text
/media/{yyyy}/{mm}/{media_id}/original.ext
/media/{yyyy}/{mm}/{media_id}/thumb.jpg
/media/{yyyy}/{mm}/{media_id}/grid.jpg
/media/{yyyy}/{mm}/{media_id}/feed.jpg
/media/{yyyy}/{mm}/{media_id}/full.jpg
/media/{yyyy}/{mm}/{media_id}/story.jpg
/media/{yyyy}/{mm}/{media_id}/cover.jpg
/media/{yyyy}/{mm}/{media_id}/short.mp4
/media/{yyyy}/{mm}/{media_id}/feed_video.mp4
/media/{yyyy}/{mm}/{media_id}/video_preview.jpg
```

## 6. Prohibited

- Do not mark ready without required variants.
- Do not expose original raw file as public fallback.
- Do not store `content://` as final URL.
- Do not depend on device local path.
- Do not remove external watermark.
- Do not double-watermark external platform media by default.
