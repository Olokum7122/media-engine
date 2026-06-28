# Explorer API Contract V1

Estado: draft inicial  
Proyecto: Atlx_ExplorerApp/api

## Responsabilidad

La Explorer API administra SaaS, proyectos, permisos, suscripciones, destinos y orquestacion con EngineShared.

## Endpoints iniciales

### POST /api/v1/explorer/tenants

```json
{
  "tenant_type": "personal",
  "display_name": "Exploradores ATLX"
}
```

### POST /api/v1/explorer/instances

```json
{
  "tenant_id": "ten_123",
  "instance_type": "explorer_studio",
  "region": "mx"
}
```

### POST /api/v1/explorer/projects

```json
{
  "tenant_id": "ten_123",
  "instance_id": "ins_123",
  "title": "En el desma",
  "project_type": "antojados_post",
  "metadata": {
    "target_surface": "desma"
  }
}
```

### POST /api/v1/explorer/projects/:projectId/assets

```json
{
  "media_asset_id": "ast_123",
  "role": "source",
  "sort_order": 0
}
```

### POST /api/v1/explorer/publications/antojados

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

## SPs requeridos

- `explorer_core.usp_tenant_create`
- `explorer_core.usp_instance_create`
- `explorer_core.usp_tenant_user_attach`
- `explorer_core.usp_project_create`
- `explorer_core.usp_project_asset_attach`
- `explorer_core.usp_connected_destination_upsert`
- `explorer_core.usp_publication_create`
- `explorer_core.usp_subscription_sync`

