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
