# 11 — Technical Debt Catalog (Media Engine V3 Edition)

Version: 2.0.0
Status: liquidated
Scope: Engine → Client integration gaps

## 1. Purpose

This catalog tracks technical debt identified in the integration between
Media Engine V3 and its downstream consumers (Antojados apps, Explorer App,
API Gateway). It covers gaps in type coverage, URL normalization, proxy
configuration, and delivery contracts.

**All 7 items have been resolved.**

## 2. Priority Definition

| Priority | Definition | Suggested timeline |
|---|---|---|
| 🔴 Critical | Blocks production consumption or causes data loss | 1-2 weeks |
| 🟡 High | Affects maintainability or creates integration friction | 1 month |
| 🟢 Medium | Architectural improvement without blocking consumption | 2-3 months |
| 🔵 Low | Cosmetic refactor or documentation | When possible |

## 3. Debt Items

### 3.1 Delivery & Contracts

| ID | Description | Files | Priority | Status | Resolution |
|---|---|---|---|---|---|
| ENG-DBT-001 | **No formal MediaPackage type** — Clients consume raw `ready-payload` response without a typed envelope. | `apps-antojados/shared/api/types/media-package.ts` | 🔴 Critical | ✅ RESUELTO | Created `MediaPackage`, `MediaPayload`, `MediaUploadResultV2`, `resolveMediaUrl()`, `resolveVideoUrl()` |
| ENG-DBT-002 | **ReadyPayload incomplete** — Missing `gridUrl`, `storyUrl`, `coverUrl`, `avatarUrl`, `videoPreviewUrl`. | `media-engine-client.service.ts` | 🔴 Critical | ✅ RESUELTO | Expanded with 13 variants + orientation, durationMs, aspectRatio, isDemoContent |
| ENG-DBT-003 | **No Media Package Contract document** — No standalone document defining the Media Package. | `docs/MEDIA_PACKAGE_CONTRACT.md` | 🟡 High | ✅ RESUELTO | Created with versioning, field mapping, fallback chains, ready rules |

### 3.2 Gateway Integration

| ID | Description | Files | Priority | Status | Resolution |
|---|---|---|---|---|---|
| ENG-DBT-004 | **Gateway has no `/api/media/*` proxy** — Clients cannot reach Engine via Gateway. | `Api_getaway_antojadosmx/src/index.js` | 🔴 Critical | ✅ RESUELTO | Added `http-proxy-middleware` on `/api/media` → Engine (port 4100) with logging and 502 errors |
| ENG-DBT-005 | **No API Central Contract** — Interaction flow between Gateway, Engine, and Apps undocumented. | `docs/API_CENTRAL_CONTRACT.md` | 🟡 High | ✅ RESUELTO | Created with routing, media_intake_id resolution, URL normalization, error propagation |

### 3.3 URL Normalization

| ID | Description | Files | Priority | Status | Resolution |
|---|---|---|---|---|---|
| ENG-DBT-006 | **No URL normalizer for Engine paths** — Engine `/media/{yyyy}/{mm}/{id}/{variant}.ext` not handled. | `apps-antojados/shared/api/services/media/normalize-media.ts` | 🟡 High | ✅ RESUELTO | Created with `normalizeMediaUrl()`, `isEngineMediaUrl()`, `resolveVariantFromUrl()`, `buildEngineMediaUrl()` |
| ENG-DBT-007 | **Explorer uses inline types for MediaPackage** — `engine.service.ts` had incomplete inline types. | `explorer-app/src/services/engine.service.ts` | 🟢 Medium | ✅ RESUELTO | Updated to full `MediaPayload`, `ReadyPayload` with 13 variants. Removed legacy fields. |

## 4. Summary

| Priority | Count | Resolved | Pending |
|---|---|---|---|
| 🔴 Critical | 3 | 3 | 0 |
| 🟡 High | 3 | 3 | 0 |
| 🟢 Medium | 1 | 1 | 0 |
| **Total** | **7** | **7** | **0** |

**All 7 items resolved. Debt liquidated.**

## 5. History

| Version | Date | Change |
|---|---|---|
| 1.0.0 | [FECHA_ACTUAL] | Initial catalog. 7 items from Engine → Client integration audit |
| 2.0.0 | [FECHA_ACTUAL] | All 7 items resolved. MEDIA_PACKAGE_CONTRACT.md, API_CENTRAL_CONTRACT.md, MediaPackage type, ReadyPayload expanded, normalize-media.ts, Gateway proxy, Explorer types updated |
