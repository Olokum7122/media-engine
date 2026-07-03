# 09 - DEVELOPER CHECKLIST

## SQL Install

- [ ] Script runs in SSMS.
- [ ] Script has no GO.
- [ ] Second run succeeds.
- [ ] Tables created.
- [ ] Indexes created.
- [ ] Views created.
- [ ] SPs created.
- [ ] Catalogs seeded.

## Functional Smoke Test

- [ ] Create image request.
- [ ] Register rights/origin.
- [ ] Register original.
- [ ] Pick job.
- [ ] Upsert thumb/grid/feed.
- [ ] Mark ready.
- [ ] Get ready payload.

## Video Smoke Test

- [ ] Create video request.
- [ ] Register rights/origin.
- [ ] Register original.
- [ ] Pick job.
- [ ] Upsert video_preview.
- [ ] Upsert short/feed_video.
- [ ] Mark ready.
- [ ] Get video payload.

## Rights Test

- [ ] official_antojados applies watermark.
- [ ] external_platform preserves external watermark.
- [ ] demo_content disables download.
- [ ] rejected rights cannot publish.
- [ ] takedown blocks processing/publishing.

## Client Test

- [ ] Android consumes ready payload only.
- [ ] iOS consumes ready payload only.
- [ ] Explorer registers origin.
- [ ] Antojados stores media_id and URLs.
- [ ] UI shows demo label.

## Anti-regression

- [ ] No original fallback.
- [ ] No content:// final URLs.
- [ ] No tenant fields.
- [ ] No social logic in engine.

## Media Package Contract

- [x] MediaPackage.version is validated before consumption.
- [x] Only 'ready' status payloads are consumed.
- [x] Correct variant used per context (thumb/grid/feed/full/story/cover/avatar/video).
- [x] Fallback chains implemented (see MEDIA_PACKAGE_CONTRACT.md §4).
- [x] null variants handled gracefully.
- [x] Demo label shown when isDemoContent === true.
- [x] All URLs normalized through normalize-media.ts.

## Gateway Proxy

- [x] /api/media/* routes to Media Engine (port 4100).
- [x] POST /api/media/requests works through proxy.
- [x] POST /api/media/{id}/rights-origin works through proxy.
- [x] POST /api/media/{id}/original works through proxy (multipart).
- [x] GET /api/media/{id}/ready-payload works through proxy.
- [x] CORS headers forwarded correctly.
- [x] Error response when Engine is unreachable (502).
