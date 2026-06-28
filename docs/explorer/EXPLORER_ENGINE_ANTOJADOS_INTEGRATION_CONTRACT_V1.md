# Explorer + EngineShared + Antojados Integration Contract V1

## 1. Flujo produccion

```text
Explorer UI
  -> Explorer API
  -> EngineShared API
  -> EngineShared worker
  -> Explorer API
  -> destino
```

## 2. Upload

Explorer UI solicita sesion:

```text
POST EngineShared /api/v1/media/upload-sessions
```

Luego registra asset:

```text
POST EngineShared /api/v1/media/assets
```

Explorer API vincula asset al proyecto:

```text
POST Explorer /api/v1/explorer/projects/:projectId/assets
```

## 3. Render

Explorer UI solicita render a traves de Explorer API o directamente a EngineShared segun politica de auth.

Contrato recomendado:

```text
Explorer UI -> Explorer API -> EngineShared API
```

porque Explorer API valida plan, permisos y location rules.

## 4. Publicacion Antojados

```text
Explorer API
  -> media renders listos
  -> Antojados connector
  -> Antojados API
  -> Antojados SPs
```

Request canonico:

```json
{
  "project_id": "prj_123",
  "destination_id": "dst_antojados",
  "target": {
    "surface": "social",
    "feed_type": "desma"
  },
  "render_ids": ["rnd_123"]
}
```

## 5. Reglas por destino Antojados

Desma:

- video vertical recomendado.
- preset `antojados_desma_vertical`.
- un render principal.

Pachanga:

- galeria multi asset.
- `event_group_id` obligatorio si se publica como evento.
- presets `antojados_pachanga_gallery_photo` o `antojados_pachanga_gallery_video`.

Business:

- requiere `place_id`.
- requiere `channel`.
- requiere `publication_type`.

## 6. Fallos y reintentos

Toda publicacion registra attempts:

- request.
- response.
- status.
- error.
- timestamp.

Ningun retry debe duplicar post si `external_post_id` ya existe.

