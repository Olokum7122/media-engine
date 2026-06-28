# ExplorerApp Client Contract V1

Estado: draft inicial  
Proyecto: Atlx_ExplorerApp

## Plataforma

```text
web/     Quasar/Vue app principal
mobile/  Capacitor Android/iOS shell
api/     Explorer API para SaaS, proyectos y conectores
```

## Capas frontend

```text
View -> composable -> service -> apiClient -> Explorer API / EngineShared API
```

Reglas:

- La UI no llama DB.
- La UI no contiene reglas de tenant.
- La UI no publica directo en Antojados.
- La UI no sube media pesada por base64 en contratos nuevos.
- Captura y seleccion ocurren en dispositivo; render pesado ocurre en EngineShared.

## Rutas iniciales web

- `/studio`
- `/studio/projects`
- `/studio/projects/:projectId`
- `/studio/capture`
- `/studio/renders`
- `/studio/publish`
- `/settings/billing`
- `/settings/destinations`
- `/settings/team`

## Servicios cliente

- `explorerApiClient`
- `tenantService`
- `projectService`
- `captureService`
- `mediaEngineService`
- `renderService`
- `publicationService`
- `destinationService`
- `billingService`

## Composables

- `useCurrentTenant`
- `useCurrentInstance`
- `useProject`
- `useCapture`
- `useUploadSession`
- `useRenderJobs`
- `useQualityReport`
- `usePublishDestinations`

## Permisos mobile

Android/iOS deben declarar y manejar:

- Camera
- Photo library
- Microphone
- Files/media picker
- Network

## Estados UI canonicos

Proyecto:

```text
draft -> editing -> rendering -> ready -> publishing -> published
draft -> archived
rendering -> error
publishing -> error
```

Upload:

```text
idle -> selecting -> preparing -> uploading -> uploaded -> registering -> ready
uploading -> error
```

Render:

```text
queued -> processing -> ready
queued -> cancelled
processing -> error
```

## Integracion EngineShared

ExplorerApp consume:

- `POST /api/v1/media/upload-sessions`
- `POST /api/v1/media/assets`
- `POST /api/v1/media/jobs/render`
- `GET /api/v1/media/jobs/:jobId`
- `GET /api/v1/media/assets/:assetId/renders`
- `GET /api/v1/media/assets/:assetId/quality`

## Integracion Antojados

ExplorerApp no llama Antojados DB.

Publica por:

```text
Explorer API -> connector -> Antojados API
```

Destino Antojados:

- Desma
- Pachanga
- Momentos
- La Neta
- Business: Vas Ir / Arre

