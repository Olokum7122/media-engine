# ExplorerApp Architecture V1

## Decision

ExplorerApp es un producto SaaS separado de Antojados. Usa Atlx_EngineShared para media y publica a Antojados solo cuando el usuario elige ese destino.

## Componentes

```text
Atlx_ExplorerApp/api
  SaaS, tenants, projects, billing, destinations

Atlx_ExplorerApp/web
  Studio UI Quasar/Vue

Atlx_ExplorerApp/mobile
  Capacitor Android/iOS shell

Atlx_EngineShared
  Uploads, assets, quality, presets, jobs, renders

AntojadosMx_v1_2
  Feed social/comercial y destino de publicacion
```

## Flujo captura a publicacion

```text
1. Usuario captura foto/video en ExplorerApp.
2. Web/Capacitor crea upload session en EngineShared.
3. EngineShared registra asset y analiza calidad.
4. Usuario elige preset/destino.
5. EngineShared genera render.
6. Explorer API crea publicacion.
7. Si destino es Antojados, connector llama Antojados API.
8. Antojados publica con sus SPs.
```

## Reglas

- Una sola UI base: web + Capacitor.
- No apps nativas separadas desde cero.
- No media engine duplicado dentro de Explorer.
- No DB directa hacia Antojados.
- Todo contrato nuevo debe tener mapper, service, resolver y SP.

