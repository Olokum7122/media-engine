# Explorer Web + Capacitor Client Spec V1

Proyecto: `Atlx_ExplorerApp/web` y `Atlx_ExplorerApp/mobile`

## 1. Stack

- Quasar.
- Vue.
- Capacitor Android/iOS.
- HTTP-only API clients.

## 2. Estructura frontend recomendada

```text
web/src/
  areas/
    studio/
    projects/
    settings/
    billing/
  shared/
    base/
    components/
    composables/
    services/
    mappers/
  router/
```

## 3. Rutas

- `/studio`
- `/studio/capture`
- `/studio/projects`
- `/studio/projects/:projectId`
- `/studio/projects/:projectId/editor`
- `/studio/projects/:projectId/renders`
- `/studio/projects/:projectId/publish`
- `/library`
- `/settings/team`
- `/settings/locations`
- `/settings/destinations`
- `/settings/billing`

## 4. Componentes base

- `ExplorerShell`
- `StudioTabBarBase`
- `StudioTopBarBase`
- `ProjectTimelineBase`
- `MediaInspectorPanel`
- `PresetSelector`
- `QualityReportPanel`
- `RenderQueuePanel`
- `PublishDestinationSheet`
- `CaptureSourceSheet`
- `LocationRulePanel`

## 5. Metadata de navegacion

Debe existir un archivo canonico:

```text
web/src/shared/base/navigationMetadata.js
```

Campos minimos:

- `id`
- `label`
- `icon`
- `route`
- `level`
- `parentContext`
- `requiredPermission`
- `featureFlag`
- `sortOrder`

Regla:

```text
Ninguna tab o subdimension se hardcodea dentro de una pantalla.
```

## 6. Servicios HTTP

- `apiClient`
- `explorerApiClient`
- `engineSharedClient`
- `projectService`
- `captureService`
- `uploadSessionService`
- `renderJobService`
- `qualityReportService`
- `destinationService`
- `publicationService`
- `billingService`

## 7. Composables

- `useCurrentTenant`
- `useCurrentInstance`
- `usePermissions`
- `useProject`
- `useProjectTimeline`
- `useCapture`
- `useUploadSession`
- `useRenderJobs`
- `useQualityReport`
- `useDestinations`
- `usePublication`

## 8. Captura Capacitor

Permisos:

- Camera.
- Photos/media library.
- Microphone.
- Files/media picker.
- Network.

Regla:

```text
Captura local, produccion pesada remota.
```

## 9. Estados UI

Upload:

```text
idle -> selecting -> preparing -> uploading -> uploaded -> registering -> ready
```

Render:

```text
queued -> processing -> ready
processing -> error
```

Publish:

```text
draft -> queued -> publishing -> published
publishing -> error
```

## 10. UX obligatoria

- Mostrar progreso de upload.
- Mostrar progreso de render.
- Mostrar calidad antes de publicar.
- Bloquear publicacion si render no esta listo.
- Bloquear Antojados si destino no esta conectado.
- Mostrar limites de plan si el usuario excede cuota.

## 11. Prohibiciones

- No base64 para archivos pesados nuevos.
- No `fetch` directo desde componentes.
- No rutas sin metadata.
- No permisos hardcodeados en UI.
- No publicar directo a Antojados desde frontend.

