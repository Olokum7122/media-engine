# 06 - API CONTRACT

> Actualizado v3.1: Endpoints versionados (/api/media/v1), matriz de variantes por orientación,
> validación de sourceApp, CORS restringido.

## 1. Principle

The API is a thin contract layer over stored procedures. It must not create hidden business rules that conflict with SQL contracts.

## 2. Versioning

El Engine expone dos versiones de la API:

| Versión | Ruta | sourceApp validation | Estado |
|---------|------|---------------------|--------|
| **v1** | `/api/media/v1/*` | ✅ Valida contra serviceRegistry | ✅ ACTUAL |
| **legacy** | `/api/media/*` | ❌ Sin validación | 🗑️ DEPRECATED (mantenido por compatibilidad) |

Los clientes NUEVOS deben usar **v1**. Los clientes legacy recibirán `_legacy: true` y `_migrate` en la respuesta.

## 3. Endpoints

### POST /api/media/v1/requests

Crea media request. Valida sourceApp contra serviceRegistry.

**Body:**
```json
{
  "sourceApp": "antojados",
  "sourceActorType": "user",
  "sourceActorId": "usr_abc",
  "targetContext": "post",
  "mediaType": "image",
  "clientReferenceId": "uuid_para_idempotencia",
  "processingProfileCode": "standard",
  "channel": "vas_ir",
  "postId": "post_xyz",
  "sponsorId": null,
  "userId": "usr_abc"
}
```

**Campos de cruce transversal:**
- `channel` — Canal AntojadosMX (vas_ir, arre, barrio, pachanga, que_pex, desma)
- `postId` — ID del post asociado (para cruce con tablas antojados_core)
- `sponsorId` — ID del sponsor (si aplica)
- `userId` — ID del usuario (si aplica)

**Processing profile se determina automáticamente** según orientación detectada:
| Orientación | Perfil |
|-------------|--------|
| portrait | `portrait_standard` |
| landscape | `landscape_standard` |
| square | `square_standard` |
| video short | `short_vertical` |

### POST /api/media/v1/{mediaId}/rights-origin

Registra derechos y origen de la media.

### POST /api/media/v1/{mediaId}/original

Registra archivo original (multipart). Campo: `file`.

### GET /api/media/v1/{mediaId}

Diagnóstico completo de la media.

### GET /api/media/v1/{mediaId}/ready-payload

**Único endpoint de consumo.** El cliente NUNCA pregunta por variantes específicas.

### GET /api/media/v1/{mediaId}/policy

Evalúa política de derechos.

### POST /api/media/v1/{mediaId}/cancel

Cancela media pendiente.

## 4. Contrato de Ready Payload

El Engine determina las variantes a producir según orientación. El cliente consume el payload completo.

### Imágenes

| Campo | Variante | Dimensión | Uso del cliente |
|-------|----------|-----------|-----------------|
| `thumbUrl` | thumb | 320×320 | Placeholder, skeleton |
| `gridUrl` | grid | 600×600 | Galería |
| `feedUrl` | **feed** | Según orientación | **Card principal** |
| `fullUrl` | full | Según orientación | Lightbox, detalle |

Dimensiones de `feedUrl` y `fullUrl` según orientación:

| Orientación | feedUrl | fullUrl |
|-------------|---------|---------|
| portrait | 1080×1350 | 1440_long |
| landscape | 1080×608 | 1920×1080 |
| square | 1080×1080 | 1440×1440 |

### Videos

| Campo | Variante | Dimensión | Uso del cliente |
|-------|----------|-----------|-----------------|
| `videoUrl` | short | 1080×1920 | Reproducción |
| `videoPreviewUrl` | video_preview | 720×1280 | Poster/thumbnail |

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
    "thumbUrl": "https://.../thumb_320.webp",
    "gridUrl": "https://.../grid_600.webp",
    "feedUrl": "https://.../feed_1080x1350.webp",
    "fullUrl": "https://.../full_1440.webp",
    "videoUrl": "https://.../short_1080x1920.mp4",
    "videoPreviewUrl": "https://.../video_preview_720x1280.webp",
    "originType": "official_antojados",
    "rightsStatus": "approved",
    "isDemoContent": false,
    "channel": "vas_ir",
    "postId": "post_xyz",
    "sponsorId": null,
    "userId": "usr_abc"
  }
}
```

## 7. Security

- CORS restringido: solo `api.antojadosmx.mx`, `localhost:8010`, `localhost:4101`, `localhost:4100`
- sourceApp debe estar registrado en serviceRegistry (en rutas v1)
- Solo worker/admin pueden marcar media como ready

## 8. Idempotency

Use `clientReferenceId`. Mismo sourceApp + mismo clientReferenceId retorna mismo mediaId.
No se crean duplicados.

## 9. Reglas de Consumo para Clientes

1. ✅ El cliente sube media → poll status → consume ready_payload
2. ✅ El cliente **NUNCA** decide qué variantes pedir
3. ✅ El cliente **NUNCA** usa `original_url` directamente
4. ✅ El cliente **NUNCA** ignora `ready_payload` (solo consumir cuando status='ready')
5. ✅ El cliente **NUNCA** guarda paths locales como media final
