# ATLX Explorer App — Integración con Media Engine V3

## 📋 Estado de los contratos

Esta carpeta contiene los **contratos y especificaciones originales** de la Explorer App (V1).
Fueron escritos cuando el Engine era `Atlx_EngineShared` (legacy). Ahora que migramos a
**Media Engine V3** (`media-engine`), algunos endpoints y flujos cambian.

## 🔄 Mapeo: Contrato original → Engine V3 actual

### Upload de media

| Contrato Explorer (V1) | Engine V3 actual | Estado |
|---|---|---|
| `POST /api/v1/media/upload-sessions` | `POST /api/media/requests` + `POST /api/media/:id/original` | ✅ Reemplazado |
| `POST /api/v1/media/assets` | `POST /api/media/:id/original` + `POST /api/media/:id/rights-origin` | ✅ Reemplazado |
| `POST /explorer/projects/:id/assets` | Se hace desde Explorer API, no del Engine | ⏳ Pendiente en Explorer |

### Ready payload

| Contrato Explorer (V1) | Engine V3 actual | Estado |
|---|---|---|
| Leer variants desde asset | `GET /api/media/:id/ready-payload` | ✅ Implementado |
| Calidad del original | `GET /api/media/:id` (metadatos) | ✅ Implementado |

### Pipeline de procesamiento

| Concepto | Engine V3 | Estado |
|---|---|---|
| Upload session (chunked) | Multipart directo por ahora | 🔧 Pendiente |
| Quality analysis | El worker extrae metadatos (dimensiones, sha256, exif) | ✅ Parcial |
| Presets / Renders | Solo `processing_profile_code` por ahora | 🔧 Pendiente |
| Jobs status público | Worker interno, no expone API | 🔧 Pendiente |

## 🗄️ Base de datos

Explorer App requiere su propia base de datos **`ATLX_EXPLORER_APP`** con schema `explorer_core.*`,
independiente de `Atlx_Mediaengine` (schema `me.*`).

**Tablas que necesita Explorer** (no existen en el Engine):
- `explorer_core.tenants`
- `explorer_core.instances`
- `explorer_core.users`
- `explorer_core.projects`
- `explorer_core.project_assets`
- `explorer_core.connected_destinations`
- `explorer_core.publications`
- `explorer_core.subscriptions`
- Y todas las demás descritas en `EXPLORERAPP_DATABASE_AND_SPS_SPEC_V1.md`

## 📦 Repositorios en GitHub

```
antojados/                        ← Proyecto en Mac
├── media-engine/                 ← Este repo (Engine V3 + docs/explorer/)
├── apps-antojados/               ← Android + iOS + shared
└── atlx-gt/                      ← GT (se recorta en Mac a solo Antojados GT)
```

## 🚀 Próximos pasos para Explorer

1. **Crear DB** `ATLX_EXPLORER_APP` en Contabo con schema `explorer_core.*`
2. **Implementar** los SPs de Explorer (listados en la spec de DB)
3. **Construir** Explorer API (SaaS que usa Engine V3 para media)
4. **Conectar** Explorer API al Engine V3 via endpoints existentes
5. **Agregar** al Engine V3 los endpoints faltantes:
   - `POST /api/media/upload-sessions` (sesiones chunked)
   - `GET /api/media/:id/quality-report` (calidad/orientación)
   - `POST /api/media/:id/render` (render por preset)

## 📄 Documentos

| Archivo | Descripción |
|---|---|
| `EXPLORER_ENGINE_ANTOJADOS_INTEGRATION_CONTRACT_V1.md` | Integración Engine + Explorer + Antojados |
| `EXPLORER_API_FULL_CONTRACT_V1.md` | API completa de Explorer |
| `EXPLORER_WEB_CAPACITOR_CLIENT_SPEC_V1.md` | Spec del cliente web/Capacitor |
| `EXPLORER_API_CONTRACT_V1.md` | Contrato API resumido |
| `EXPLORER_APP_CLIENT_CONTRACT_V1.md` | Contrato del cliente |
| `EXPLORER_STRICT_DEVELOPMENT_CONTRACT_V1.md` | Reglas de desarrollo estrictas |
| `EXPLORERAPP_DATABASE_AND_SPS_SPEC_V1.md` | DB y SPs de Explorer |
| `ARCHITECTURE_V1.md` | Arquitectura del sistema |
| `DEV_MASTER_MAP_V1.md` | Mapa maestro de desarrollo |
