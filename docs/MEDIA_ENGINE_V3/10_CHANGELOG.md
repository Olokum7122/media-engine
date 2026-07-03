# 10 - CHANGELOG

## V3.0.0

Consolidated baseline.

Merged:
- Media Engine V2 core.
- Rights & Origin V2.1.
- Conversation decisions about external platform content.
- Employee-generated official Antojados content.
- Explorer partner distinction.
- Watermark policy.
- Demo content restrictions.
- SQL and Codex guardrails.

Key changes:
- Added `official_antojados`.
- Added `explorer_partner`.
- Removed reliance on `captured_by_explorer` as a single ambiguous type.
- Added ownership model.
- Added employment-generated flag.
- Added policy evaluation.
- Added stronger rules for external platform content.
- Added demo content governance.

## V3.1.0 — Media Package Normalization ✅

This release standardizes the Media Package delivery format and normalizes
consumption across all clients (Android, iOS, Explorer App).

**All 7 planned items have been implemented and verified.**

### Changes (Completed)

- **New Contract**: `MEDIA_PACKAGE_CONTRACT.md` — formal delivery format with all 13 variants,
  version field, mapping by context, ready rules, and fallback chains.
- **New Contract**: `API_CENTRAL_CONTRACT.md` — ecosystem interaction contract
  (Gateway ↔ Engine ↔ Apps) with routing, URL resolution, error propagation.
- **New Type**: `MediaPackage` — typed delivery envelope with `mediaId`, `version`,
  `status`, `payload`. Created in `shared/api/types/media-package.ts`.
- **Expanded Variants**: `ReadyPayload` now includes all 13 variants (thumb, grid, feed, full,
  story, cover, avatar, original, video, video1080, short, feedVideo, storyVideo, videoPreview)
  plus metadata (durationMs, aspectRatio, originType, rightsStatus, isDemoContent).
- **URL Normalizer**: `normalize-media.ts` (Antojados) resolves Engine public URLs
  with proper domain and protocol. Includes `isEngineMediaUrl()`, `resolveVariantFromUrl()`,
  `buildEngineMediaUrl()`.
- **Gateway Proxy**: `Api_getaway_antojadosmx` adds `/api/media/*` → Engine proxy
  using `http-proxy-middleware` with logging and 502 error handling.
- **Explorer Updated**: `engine.service.ts` now uses full `MediaPayload` type with
  13 variants. Legacy inline types removed.

### Resolved Items

| ID | Description | Status |
|---|---|---|
| ENG-DBT-001 | Missing `MediaPackage` type | ✅ RESUELTO |
| ENG-DBT-002 | Incomplete `ReadyPayload` | ✅ RESUELTO |
| ENG-DBT-003 | No `MEDIA_PACKAGE_CONTRACT.md` | ✅ RESUELTO |
| ENG-DBT-004 | Gateway missing `/api/media/*` proxy | ✅ RESUELTO |
| ENG-DBT-005 | No `API_CENTRAL_CONTRACT.md` | ✅ RESUELTO |
| ENG-DBT-006 | Missing URL normalizer | ✅ RESUELTO |
| ENG-DBT-007 | Explorer inline types | ✅ RESUELTO |

All 7 technical debt items resolved. See `11_TECHNICAL_DEBT.md` for details.

