# 05 - CLIENT CONSUMPTION SPEC

## 1. Scope

Consumers:
- Android
- iOS
- Explorer App
- Web future
- Antojados API

## 2. Main Rule

Clients never consume temporary media as final media.

Clients consume only:
- `ready_payload`
- public processed variants
- status and policy from Media Engine

## 3. Android/iOS Flow

```text
select media
  ↓
create media request
  ↓
register rights/origin
  ↓
upload/register original
  ↓
poll status
  ↓
get ready payload
  ↓
create/update Antojados post
```

## 4. Explorer Flow

```text
capture/produce content
  ↓
create request as explorer/employee/partner
  ↓
register rights/origin
  ↓
upload/register original
  ↓
review generated variants
  ↓
publish to Antojados context
```

## 5. Rendering Rules

### Gallery

Use:
- `grid_url`

Fallback:
- `thumb_url`

Never:
- original raw

### Feed Image

Use:
- `feed_url`

### Video

Use:
- preview: `video_preview_url`
- playback: `video_url`

### Fullscreen

Use:
- image: `full_url`
- video: `video_url`

## 6. UI Labels

If `is_demo_content = 1`, UI must show demo label.

If `origin_type = external_platform`, UI should preserve attribution when available.

## 7. Prohibited Client Behavior

- No heavy final video processing in public apps.
- No storing picker local path as final media.
- No final `content://` URL.
- No direct DB table access.
- No bypassing rights/origin registration.
- No forcing Antojados watermark from UI.
