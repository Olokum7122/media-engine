# ATLX Explorer Media Dev Master Map V1

Fecha: 2026-06-17  
Alcance: AntojadosMx_v1_2, Atlx_EngineShared, Atlx_ExplorerApp  
Modo: ejecucion estricta por fases

## 1. Objetivo

Este documento organiza el desarrollo por fases y checklists para evitar construir piezas aisladas sin contrato, DB, SP, API, mapper, frontend y validacion.

Proyectos:

```text
C:\ecosistema-atlx\AntojadosMx_v1_2
C:\ecosistema-atlx\Atlx_EngineShared
C:\ecosistema-atlx\Atlx_ExplorerApp
```

## 2. Regla de avance

No se avanza de fase si el entregable de la fase anterior no cumple:

- Spec actualizado.
- Contrato actualizado.
- DB/SP definido si aplica.
- API definido si aplica.
- Mapper/service/resolver definido si aplica.
- Frontend/service/composable definido si aplica.
- Integracion registrada.
- Checklist marcado.

## 3. Fase 0 - Orden canonico y endurecimiento de Antojados

Objetivo: dejar Antojados estable como consumidor/destino antes de escalar Explorer.

### AntojadosMx_v1_2

Checklist:

- [ ] Revisar endpoints actuales de media, posts, biz posts.
- [ ] Mantener endpoints legacy funcionando.
- [ ] Crear `engineSharedClient.js`.
- [ ] Agregar variables `ENGINE_SHARED_BASE_URL`, `ENGINE_SHARED_API_KEY`, `ENGINE_SHARED_TIMEOUT_MS`.
- [ ] Cambiar `media.service.js` para usar EngineShared si esta configurado.
- [ ] Mantener fallback legacy local.
- [ ] Migrar publicacion social a `antojados_core.usp_publish_soc_post`.
- [ ] Migrar attach social a `antojados_core.sp_soc_post_media_attach`.
- [ ] Crear SPs faltantes de intake/assets si se mantiene compatibilidad legacy.
- [ ] Corregir mismatch de limites upload cliente/server.
- [ ] Definir si `video_1080_url` se implementa o se retira temporalmente del contrato.

Criterio de cierre:

```text
Antojados puede publicar Desma/Pachanga con engine local legacy o EngineShared sin romper app actual.
```

## 4. Fase 1 - Atlx_EngineShared base real

Objetivo: convertir el engine extraido en servicio real.

### Atlx_EngineShared

Checklist:

- [ ] Crear estructura final `api`, `workers`, `docs`, `migrations`, `contracts`.
- [ ] Mover `src/index.js` bajo `api` si se decide layout final.
- [ ] Crear DB/schema `ATLX_MEDIA_ENGINE` / `media_core`.
- [ ] Crear migrations SQL Server.
- [ ] Crear SPs `media_core.usp_upload_session_create`.
- [ ] Crear SPs `media_core.usp_media_asset_register`.
- [ ] Crear SPs `media_core.usp_quality_report_register`.
- [ ] Crear SPs `media_core.usp_media_job_enqueue`.
- [ ] Crear SPs `media_core.usp_media_job_lock_next`.
- [ ] Crear SPs `media_core.usp_media_render_register`.
- [ ] Implementar API `/api/v1/media/upload-sessions`.
- [ ] Implementar API `/api/v1/media/assets`.
- [ ] Implementar API `/api/v1/media/jobs/render`.
- [ ] Implementar API `/api/v1/media/jobs/:jobId`.
- [ ] Implementar API `/api/v1/media/assets/:assetId/renders`.
- [ ] Implementar worker con lock transaccional.
- [ ] Implementar delivery callback.
- [ ] Implementar `delivery_status`.
- [ ] Implementar presets iniciales.
- [ ] Implementar quality report basico.

Criterio de cierre:

```text
EngineShared recibe un archivo, registra asset, genera quality report, renderiza un preset y entrega callback al consumidor.
```

## 5. Fase 2 - ATLX_EXPLORER_APP DB y API

Objetivo: crear el backend SaaS de Explorer.

### Atlx_ExplorerApp/api

Checklist DB:

- [ ] Crear DB `ATLX_EXPLORER_APP`.
- [ ] Crear schema `explorer_core`.
- [ ] Crear tablas tenants, instances, users, roles.
- [ ] Crear tablas tenant_users, locations, location_rules.
- [ ] Crear tablas plans, subscriptions, usage_counters.
- [ ] Crear tablas projects, project_assets, project_timelines.
- [ ] Crear tablas connected_destinations.
- [ ] Crear tablas publications, publication_assets, publication_attempts.
- [ ] Crear tabla `output_tray`.
- [ ] Crear tabla `integration_events`.

Checklist SP:

- [ ] SPs tenant/instance/user.
- [ ] SPs location/rules.
- [ ] SPs billing/usage.
- [ ] SPs projects/assets/timeline.
- [ ] SPs destinations.
- [ ] SPs publications.
- [ ] SPs output tray.

Checklist API:

- [ ] Crear API shell.
- [ ] Configurar DB connection.
- [ ] Implementar routes tenants/instances.
- [ ] Implementar routes projects.
- [ ] Implementar routes destinations.
- [ ] Implementar routes publications.
- [ ] Implementar EngineShared client.
- [ ] Implementar callback `/integration/engine/render-ready`.
- [ ] Implementar mappers no passthrough.
- [ ] Implementar services/resolvers.

Criterio de cierre:

```text
Explorer API crea proyecto, adjunta media_asset_id, guarda timeline, solicita render y registra output/publication.
```

## 6. Fase 3 - Explorer Web + Capacitor shell

Objetivo: crear la experiencia de estudio.

### Atlx_ExplorerApp/web

Checklist base:

- [ ] Inicializar Quasar/Vue.
- [ ] Crear router.
- [ ] Crear `navigationMetadata.js`.
- [ ] Crear `ExplorerShell`.
- [ ] Crear `StudioTabBarBase`.
- [ ] Crear `StudioTopBarBase`.
- [ ] Crear api clients.
- [ ] Crear services HTTP-only.
- [ ] Crear composables core.

Checklist pantallas:

- [ ] `/studio`.
- [ ] `/studio/capture`.
- [ ] `/studio/projects`.
- [ ] `/studio/projects/:projectId`.
- [ ] `/studio/projects/:projectId/editor`.
- [ ] `/studio/projects/:projectId/renders`.
- [ ] `/studio/projects/:projectId/publish`.
- [ ] `/library`.
- [ ] `/settings/destinations`.
- [ ] `/settings/billing`.

Checklist editor:

- [ ] Capture/import.
- [ ] Upload progress.
- [ ] Media preview.
- [ ] Quality report.
- [ ] Crop/aspect ratio.
- [ ] Auto enhance photo.
- [ ] Auto enhance video basico.
- [ ] Trim video.
- [ ] Preset selector.
- [ ] Render queue.
- [ ] Output tray.
- [ ] Publish destination sheet.

### Atlx_ExplorerApp/mobile

Checklist Capacitor:

- [ ] Inicializar Capacitor.
- [ ] Configurar Android.
- [ ] Configurar iOS.
- [ ] Declarar permisos Camera.
- [ ] Declarar permisos Photos/media.
- [ ] Declarar permisos Microphone.
- [ ] Declarar permisos Files.
- [ ] Probar captura en device/emulador.
- [ ] Probar upload desde mobile.

Criterio de cierre:

```text
Usuario puede capturar/importar, ver calidad, editar basico, renderizar y ver output listo.
```

## 7. Fase 4 - Conector Antojados desde Explorer

Objetivo: publicar desde Explorer hacia Antojados sin tocar DB directa.

### Atlx_ExplorerApp

Checklist:

- [ ] Crear connected destination Antojados.
- [ ] Validar permisos por tenant/instance/user.
- [ ] Validar rules por location.
- [ ] Crear publication con destination_type `antojados`.
- [ ] Adjuntar render_ids.
- [ ] Enviar payload a Antojados API/adapter.
- [ ] Registrar publication_attempt.
- [ ] Guardar external_post_id.
- [ ] Manejar retry sin duplicar post.

### AntojadosMx_v1_2

Checklist:

- [ ] Crear endpoint de recepcion desde connector si falta.
- [ ] Validar user/sponsor/target.
- [ ] Publicar social con SP.
- [ ] Publicar business con SP.
- [ ] Registrar media en tablas Antojados.
- [ ] Emitir evento `antojados.post_published`.

Criterio de cierre:

```text
Explorer publica un render a Desma/Pachanga y Antojados lo muestra en feed usando sus propias tablas/SPs.
```

## 8. Fase 5 - Billing, limits y monetizacion

Objetivo: habilitar modelo SaaS.

### Atlx_ExplorerApp

Checklist:

- [ ] Definir planes trial, creator, team, antojados_connected, agency.
- [ ] Seed de plans.
- [ ] Subscription sync.
- [ ] Usage counters.
- [ ] Bloqueo por limites.
- [ ] UI de billing.
- [ ] UI de uso mensual.
- [ ] Enforcement antes de render.
- [ ] Enforcement antes de publicar.

Criterio de cierre:

```text
Los renders, storage, destinos y usuarios respetan plan/limites.
```

## 9. Fase 6 - Hardening, calidad y release

Objetivo: preparar uso real.

Checklist general:

- [ ] Logs con request_id.
- [ ] Errores normalizados.
- [ ] Health checks por servicio.
- [ ] Scripts de verificacion.
- [ ] Backup de DB.
- [ ] Migraciones repetibles.
- [ ] Validacion desktop/mobile/tablet.
- [ ] Pruebas de upload grande.
- [ ] Pruebas de render video.
- [ ] Pruebas de callback fallido.
- [ ] Pruebas de retry publication.
- [ ] Documentar runbooks.

Criterio de cierre:

```text
El sistema puede operar con Antojados actual y ExplorerApp sin flujos huerfanos.
```

## 10. Dependencias entre fases

```text
Fase 0 desbloquea Antojados estable.
Fase 1 desbloquea procesamiento compartido.
Fase 2 desbloquea producto SaaS.
Fase 3 desbloquea experiencia de usuario.
Fase 4 desbloquea publicacion a Antojados.
Fase 5 desbloquea monetizacion.
Fase 6 desbloquea release.
```

## 11. Documentos que gobiernan este mapa

ExplorerApp:

- `Atlx_ExplorerApp/docs/CANONICAL_SOURCE_OF_TRUTH_INDEX.md`
- `Atlx_ExplorerApp/docs/CONTRACT_NAVIGATION_MAP.md`
- `Atlx_ExplorerApp/contracts/quality/EXPLORER_STRICT_DEVELOPMENT_CONTRACT_V1.md`

EngineShared:

- `Atlx_EngineShared/docs/CONTRACT_NAVIGATION_MAP.md`
- `Atlx_EngineShared/docs/contracts/ENGINE_SHARED_API_CONTRACT_V1.md`
- `Atlx_EngineShared/docs/contracts/ENGINE_SHARED_INTEGRATION_OWNERSHIP_CONTRACT_V1.md`

Antojados:

- `AntojadosMx_v1_2/api/docs/contracts/ENGINE_SHARED_CONSUMPTION_CONTRACT_V1.md`
- `AntojadosMx_v1_2/api/docs/contracts/CONTRACT_NAVIGATION_MAP.md`

## 12. Regla final

Si una tarea no se puede ubicar en una fase, proyecto y checklist, todavia no esta lista para implementarse.

