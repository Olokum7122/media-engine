# 07 - DATABASE CONTRACT

> Actualizado v3.1: Sincronizado con BD real (ATLX_MediaEngine). Se agregaron tablas de
> catálogo, perfiles de procesamiento y columnas de cruce transversal.

## 1. SQL Rules

- SQL Server.
- Schema `me`.
- Idempotent scripts.
- No `GO`.
- Stored procedures created through `EXEC('CREATE OR ALTER PROCEDURE ...')`.
- No destructive migrations without explicit approval.
- Additive changes only unless version changes.

## 2. Core Tables

| Tabla | Propósito | Columnas clave |
|-------|-----------|----------------|
| `me.media_request` | Solicitud de procesamiento multimedia | `media_id`, `source_app`, `source_actor_type`, `source_actor_id`, `target_context`, `media_type`, `status`, `channel`, `post_id`, `sponsor_id`, `user_id` |
| `me.media_rights_origin` | Derechos de autor/origen de la media | `media_id`, `origin_type`, `origin_platform`, `rights_status`, `is_demo_content` |
| `me.media_original` | Archivo original subido | `media_id`, `original_url`, `sha256_hash`, `mime_type`, `size_bytes`, `width`, `height` |
| `me.media_variant` | Variantes procesadas de la media | `media_id`, `variant_code`, `url`, `width`, `height`, `channel`, `post_id`, `sponsor_id`, `user_id` |
| `me.processing_job` | Jobs internos del worker de procesamiento | `media_id`, `job_type`, `status`, `priority`, `attempts` |
| `me.media_event_log` | Log de eventos de auditoría | `media_id`, `job_id`, `event_code`, `event_message` |

### 2.1 Columnas de Cruce Transversal

Las columnas `channel`, `post_id`, `sponsor_id`, `user_id` en `media_request` y `media_variant`
son **metadata de cruce** para que los clientes (AntojadosMX, Explorer, etc.) puedan asociar
la media procesada con sus propios posts/canales. El Engine las almacena pero NO las interpreta.

**Regla:** Un cliente que envía `sourceApp='antojados'` debe incluir `post_id` y `channel`.
El Engine no valida estos campos — solo los almacena para devolverlos en el ready-payload.

## 3. Catalog Tables

| Tabla | Propósito | Datos actuales |
|-------|-----------|----------------|
| `me.media_variant_catalog` | Catálogo de variantes de procesamiento | 12 variantes: thumb, grid, feed, full, story, short, cover, avatar, video_preview, watermarked, feed_video, original_safe |
| `me.processing_profile` | Perfiles de procesamiento configurados | 3 perfiles: standard, mobile_fast, explorer_high |
| `me.watermark_profile` | Perfiles de marca de agua | Configurable |
| `me.media_error_catalog` | Catálogo de errores conocidos | Configurable |
| `me.media_status_catalog` | Catálogo de estados del flujo | received → uploading → uploaded → queued → processing → ready/failed/rejected/canceled/expired |

### 3.1 Variantes de Procesamiento (media_variant_catalog)

| Código | Orden | Tipo | Descripción |
|--------|-------|------|-------------|
| `thumb` | 10 | image | Miniature thumbnail |
| `grid` | 20 | image | Grid/cuadrícula para galerías |
| `feed` | 30 | image | Feed principal (tarjetas) |
| `full` | 40 | image | Tamaño completo / detalle |
| `story` | 50 | image | Historia (formato vertical) |
| `short` | 60 | video | Video corto (Reels/Shorts) |
| `cover` | 70 | image | Portada de perfil/negocio |
| `avatar` | 80 | image | Avatar de usuario |
| `video_preview` | 90 | video | Preview/gif de video |
| `watermarked` | 100 | image/video | Versión con marca de agua |
| `feed_video` | 110 | video | Video para feed |
| `original_safe` | 120 | original | Copia segura del original |

### 3.2 Perfiles de Procesamiento (processing_profile)

| Código | Display | Uso | Reglas |
|--------|---------|-----|--------|
| `standard` | Standard | Perfil por defecto | thumb:320x320, grid:600x600, feed:1080x1350, full:1440_long, video:1080x1920@30fps h264 aac |
| `mobile_fast` | Mobile Fast | Calidad reducida móvil | image quality:78, video bitrate:2500k |
| `explorer_high` | Explorer High | Alta calidad editorial | image quality:88, video bitrate:4500k, watermark:policy_based |

## 4. Public Stored Procedures

### 4.1 API Pública

| SP | Función | Parámetros clave |
|----|---------|------------------|
| `me.sp_media_request_create` | Crear solicitud de procesamiento | `source_app`, `source_actor_type`, `source_actor_id`, `target_context`, `media_type`, `client_reference_id`, `processing_profile_code` |
| `me.sp_media_rights_origin_upsert` | Registrar/actualizar derechos | `media_id`, `origin_type`, `origin_platform`, `rights_status` |
| `me.sp_media_rights_origin_get` | Obtener derechos registrados | `media_id` |
| `me.sp_media_rights_policy_evaluate` | Evaluar política de derechos | `media_id` |
| `me.sp_media_original_register` | Registrar archivo original subido | `media_id`, `original_url`, `mime_type`, `sha256_hash`, `size_bytes` |
| `me.sp_media_get_by_id` | Obtener información completa de media | `media_id` — Devuelve 6 resultsets (request, rights, original, variants, jobs, events) |
| `me.sp_media_get_ready_payload` | Obtener payload listo para consumo | `media_id` — **Solo retorna URLs si status='ready'** |
| `me.sp_media_cancel` | Cancelar media pendiente | `media_id`, `reason` |

### 4.2 Worker Interno

| SP | Función |
|----|---------|
| `me.sp_media_job_pick_next` | Reservar el siguiente trabajo elegible. **Firma ampliada en la 22**: `@worker_id, @job_type=NULL, @media_type=NULL, @exclude_media_type=NULL`. `UPDLOCK, READPAST` sobre `ix_me_job_queue` y respeta `next_attempt_at`. Los filtros de tipo permiten el carril rápido de audio sobre la MISMA cola. |
| `me.sp_media_job_mark_running` | Marcar trabajo como en ejecución |
| `me.sp_media_job_heartbeat` | Renovar el lease del job (migración 19) para que el reaper no reclame un transcode vivo |
| `me.sp_media_job_reap_stale` | Devolver a la cola los jobs con lease vencido (migración 18) |
| `me.sp_media_job_retry_or_fail` | Decidir entre reintento aplazado (`next_attempt_at`) y `dead_letter` (migración 18) |
| `me.sp_media_queue_stats` | Foto de la cola por estado (migración 18; la consume `v_media_queue_health`) |
| `me.sp_media_variant_upsert` | Insertar o actualizar variante procesada |
| `me.sp_media_mark_ready` | Marcar media como lista (completada) |
| `me.sp_media_mark_failed` | Marcar media como fallida |
| `me.sp_media_mark_rejected` | Marcar media como rechazada |

### 4.3 Guarda de actor

| SP | Origen | Función |
|----|--------|---------|
| `me.sp_media_actor_busy` | 16, reescrito en **22** | Dice si el actor tiene trabajo real en curso. Devuelve `busy, active_count, media_id, media_type, status, target_context, elapsed_seconds, identity_missing, busy_reason` (`processing` \| `upload_in_flight` \| `awaiting_processing`). |

Reglas que la 22 fijó, y que no deben revertirse:

1. **Sólo bloquea trabajo con job vivo** (`pending`/`running`). Un `processing`
   sin job es un residuo del reaper, no trabajo en curso.
2. **No contiene a un actor sin identidad.** Un marcador compartido (`unknown`,
   `anon`, vacío) devuelve `busy = 0` con `identity_missing = 1`. Contener por
   ese marcador cierra la puerta a todos los usuarios que lo comparten, que es
   exactamente lo que ocurrió el 2026-11-01.
3. **El motivo se nombra.** Una subida en vuelo, una espera de cola y un
   procesamiento en curso son estados distintos y el cliente los comunica
   distinto.


## 5. Public Views

| Vista | Función |
|-------|---------|
| `me.v_media_ready_payload` | JOIN de request + rights + original + variant. Devuelve URLs organizadas por variant_code. Solo útil si status = 'ready'. **Definición final en `23_READY_PAYLOAD_METADATA_AUDIO.sql`** (36 columnas): superset de 06, 12 y 17, más `avatar_url`, `story_url`, `audio_url` y `audio_preview_url`. Cualquier migración futura debe partir de 23, no de 06/12/17. |
| `me.v_media_request_summary` | Resumen con source_app, status, conteo de variantes y jobs |
| `me.v_media_queue_health` | Salud de la cola por estado (migración 18) |
| `me.v_media_actor_inflight` | Peticiones en vuelo por actor, con `job_alive` y `identity_missing`, para diagnosticar qué bloquea a quién (migración 18) |

## 6. Ready Contract

`sp_media_get_ready_payload` must not return final URLs unless media is ready.
Si status != 'ready', todas las URLs retornan NULL.

## 7. Compatibility Rules

**Allowed:**
- Add nullable columns.
- Add new catalogs.
- Add new SPs.
- Add new optional params at end.
- Add new variant codes (requiere actualizar CHECK constraint).

**Forbidden:**
- Rename public columns.
- Rename public SPs.
- Remove official codes.
- Change semantic meaning.
- Add tenant/post/ranking logic (excepto columnas de cruce transversal).