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

## 5. Matriz de Variantes por Orientación (Contrato de Consumo)

> El Engine determina el perfil de procesamiento según orientación del original.
> El cliente consume las variantes que el Engine produce según esta matriz.
> **El cliente no decide qué variantes pedir — el Engine decide qué producir.**

### 5.1 Imágenes

| Orientación | Perfil | thumb (320×320) | feed | full | 
|-------------|--------|-----------------|------|------|
| **Portrait** (alta > ancho) | `portrait_standard` | ✅ 320×320 | ✅ **1080×1350** | ✅ 1440_long |
| **Landscape** (ancho > alta) | `landscape_standard` | ✅ 320×320 | ✅ **1080×608** | ✅ 1920×1080 |
| **Square** (igual) | `square_standard` | ✅ 320×320 | ✅ **1080×1080** | ✅ 1440×1440 |

### 5.2 Videos

| Contexto | Perfil | short (1080×1920) | video_preview (720×1280) |
|----------|--------|-------------------|--------------------------|
| Short (desma, que_pex) | `short_vertical` | ✅ Video MP4 H.264 AAC | ✅ Thumbnail imagen |
| Post normal portrait | `portrait_standard` | ✅ Video MP4 H.264 AAC | — |
| Post normal landscape | `landscape_standard` | — | — |
| Post normal square | `square_standard` | — | — |

### 5.3 Mapeo a Ready Payload (ready_payload)

| Campo en payload | Variante Engine | Uso del cliente |
|-----------------|----------------|-----------------|
| `thumb_url` | thumb (320×320) | Gallery fallback, preview, skeleton |
| `grid_url` | grid (600×600) | Gallery principal |
| `feed_url` | feed (según orientación) | **Card principal del feed** |
| `full_url` | full (según orientación) | Lightbox, detalle, fullscreen |
| `video_url` | short (1080×1920) | **Reproducción de video** |
| `video_preview_url` | video_preview (720×1280) | Poster/thumbnail de video |

### 5.4 Reglas de Renderizado por Componente

#### Card Feed (vista principal)

| Elemento | Usar | Fuente |
|----------|------|--------|
| Imagen principal | `feed_url` | ready_payload |
| Placeholder carga | `thumb_url` | ready_payload |
| Galería múltiple | `grid_url` (fallback: `thumb_url`) | ready_payload |
| Badge/watermark | Según `is_demo_content` y `origin_type` | ready_payload |

#### Video / Shorts (El Desma)

| Elemento | Usar | Fuente |
|----------|------|--------|
| Poster del video | `video_preview_url` | ready_payload |
| Reproducción | `video_url` | ready_payload |
| Placeholder carga | `thumb_url` | ready_payload |

#### Fullscreen / Detalle

| Elemento | Usar | Fuente |
|----------|------|--------|
| Imagen | `full_url` | ready_payload |
| Video | `video_url` | ready_payload |

### 5.5 Prohibiciones

- ❌ El cliente **NUNCA** usa `original_url` directamente (raw original sin procesar)
- ❌ El cliente **NUNCA** guarda paths locales como media final
- ❌ El cliente **NUNCA** decide dimensiones — el Engine las determina por perfil
- ❌ El cliente **NUNCA** ignora `ready_payload` — solo consume cuando status='ready'
- ❌ El cliente **NUNCA** pregunta por variantes específicas — consume el payload completo

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
