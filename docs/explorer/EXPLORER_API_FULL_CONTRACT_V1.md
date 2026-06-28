# Explorer API Full Contract V1

Base path: `/api/v1/explorer`  
Formato: JSON  
Auth: bearer token o sesion ATLX, resuelta a `user_id`

## 1. Reglas API

- Todo endpoint mutante llama SP.
- Todo response publico pasa por mapper.
- Errores tienen `error.code`, `error.message`, `request_id`.
- Paginacion usa `limit`, `offset`.
- Fechas en ISO 8601 UTC.

## 2. Tenants

### POST /tenants

SP: `explorer_core.usp_tenant_create`

Request:

```json
{
  "tenant_type": "personal",
  "display_name": "Exploradores ATLX"
}
```

Response:

```json
{
  "tenant_id": "ten_123",
  "tenant_type": "personal",
  "display_name": "Exploradores ATLX",
  "status": "active"
}
```

### GET /tenants/:tenantId

SP: `explorer_core.usp_tenant_get`

## 3. Instances

### POST /instances

SP: `explorer_core.usp_instance_create`

Request:

```json
{
  "tenant_id": "ten_123",
  "instance_type": "explorer_studio",
  "region": "mx",
  "timezone": "America/Mexico_City"
}
```

## 4. Projects

### POST /projects

SP: `explorer_core.usp_project_create`

Request:

```json
{
  "tenant_id": "ten_123",
  "instance_id": "ins_123",
  "location_id": "loc_123",
  "title": "Viernes en el desma",
  "project_type": "antojados_post",
  "metadata": {
    "target_surface": "desma"
  }
}
```

Response:

```json
{
  "project_id": "prj_123",
  "status": "draft"
}
```

### GET /projects

SP: `explorer_core.usp_project_list`

Query:

```text
tenant_id
instance_id
status
limit
offset
```

### GET /projects/:projectId

SP: `explorer_core.usp_project_get`

### PATCH /projects/:projectId/metadata

SP: `explorer_core.usp_project_update_metadata`

### POST /projects/:projectId/assets

SP: `explorer_core.usp_project_asset_attach`

Request:

```json
{
  "media_asset_id": "ast_123",
  "role": "source",
  "sort_order": 0
}
```

### POST /projects/:projectId/timeline

SP: `explorer_core.usp_project_timeline_save`

Request:

```json
{
  "timeline": {
    "tracks": [],
    "clips": [],
    "overlays": []
  }
}
```

## 5. Destinations

### POST /destinations

SP: `explorer_core.usp_connected_destination_upsert`

Request:

```json
{
  "tenant_id": "ten_123",
  "instance_id": "ins_123",
  "destination_type": "antojados",
  "display_name": "Antojados principal",
  "external_ref": "antojados-main",
  "settings": {
    "allowed_feed_types": ["desma", "pachanga"]
  }
}
```

### GET /destinations

SP: `explorer_core.usp_connected_destinations_list`

## 6. Publications

### POST /publications

SPs:

- `explorer_core.usp_publication_create`
- `explorer_core.usp_publication_asset_attach`
- `explorer_core.usp_publication_queue`

Request:

```json
{
  "tenant_id": "ten_123",
  "instance_id": "ins_123",
  "project_id": "prj_123",
  "destination_id": "dst_123",
  "destination_type": "antojados",
  "target": {
    "surface": "social",
    "feed_type": "desma",
    "venue_name": "En el desma",
    "moment_tag": "Noche de tacos"
  },
  "payload": {
    "caption": "Explorando sabores"
  },
  "render_ids": ["rnd_123"]
}
```

Response:

```json
{
  "publication_id": "pub_123",
  "status": "queued"
}
```

## 7. Billing

### GET /billing/subscription

SP: `explorer_core.usp_subscription_get_current`

### POST /billing/subscription/sync

SP: `explorer_core.usp_subscription_sync`

## 8. Mappers obligatorios

- `tenantMapper`
- `instanceMapper`
- `userMapper`
- `locationMapper`
- `projectMapper`
- `destinationMapper`
- `publicationMapper`
- `billingMapper`

Ningun mapper nuevo puede ser passthrough.

