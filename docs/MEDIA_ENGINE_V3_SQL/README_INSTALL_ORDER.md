# ATLX Media Engine V3 — ORDEN DE INSTALACIÓN

Base objetivo: `ATLX_Mediaengine`. El contrato escribe `ATLX_MediaEngine` y la
collation por defecto es insensible a mayúsculas, así que `USE` y `DB_ID`
resuelven a la misma base.

⚠️ **`Atlx_Media_Engine` (con guion bajo) es OTRA base** y **no** forma parte de
este contrato: contiene el modelo viejo `medios_operacion` (15 tablas), ningún
archivo de `media-engine/src` la lee, y su SQL vive deprecado en
`media-engine/sql/_legacy_v2_deprecado/`. No confundirla con la del motor.

---

## Regla de ejecución

- **Un archivo por lote, en el orden de la tabla.** Cada archivo es idempotente
  en su propio nivel (`IF NOT EXISTS`, `CREATE OR ALTER`, `IF COL_LENGTH`).
- **Sólo 18, 19, 20 y 22 contienen `GO`.** Separan lotes porque
  `CREATE OR ALTER PROCEDURE` debe abrir uno. El aplicador debe partir por `GO`
  en línea sola; `sqlcmd` y `scripts/_apply_sql.mjs` ya lo hacen. El resto del
  directorio es un único lote y no lleva `GO`. La 23 y la 24 tampoco llevan `GO`:
  envuelven sus `CREATE OR ALTER` en `EXEC(N'...')`, que es la forma que ya usa
  la 17.
- Al terminar, la última línea instalada debe ser `24_QUEUE_INTEGRITY_OK`.

---

## Secuencia

| # | Archivo | Qué instala | Depende de |
|---|---|---|---|
| 00 | `00_CREATE_DATABASE.sql` | Base `ATLX_MediaEngine` (recovery SIMPLE) | — |
| 01 | `01_CREATE_SCHEMA.sql` | Esquema `me` | 00 |
| 02 | `02_CATALOGS.sql` | Catálogos: estados, tipos, perfiles, códigos de variante | 01 |
| 03 | `03_TABLES.sql` | Tablas del motor, incl. `processing_job.next_attempt_at` y `dead_letter` | 02 |
| 04 | `04_INDEXES.sql` | `ix_me_job_queue` (índice ÚNICO de cola) y el resto | 03 |
| 05 | `05_SEED.sql` | Datos iniciales (perfiles, límites) | 02, 03 |
| 06 | `06_VIEWS.sql` | `v_media_ready_payload`, `v_media_request_summary` | 03 |
| 07 | `07_PROCEDURES_CORE.sql` | `sp_media_request_create`, `sp_media_request_get`, `sp_media_mark_*`, `sp_media_cancel` | 03, 04, **06** |
| 08 | `08_PROCEDURES_RIGHTS.sql` | Derechos de origen y política de watermark | 03, 07 |
| 09 | `09_PROCEDURES_WORKER.sql` | Cola: reservar, latido, cerrar, reintentar | 03, 04, 07 |
| 10 | `10_VALIDATE_INSTALL.sql` | Verificación de instalación base | 00–09 |
| 11 | `11_EDITORIAL_COLABORATTOR_SOURCE_APPS.sql` | `colaborattor` y `editorial` como `source_app` en contrato v1 | 03 |
| 12 | `12_MEDIA_REQUEST_TRANSVERSAL_METADATA.sql` | `channel, post_id, sponsor_id, user_id` en `media_request` **y ALTER de `v_media_ready_payload`** | 03, 06 |
| 13 | `13_AUDIO_MEDIA_TYPE.sql` | Tipo `audio`: `ck_me_request_media_type`, variantes `audio_full` / `audio_preview` | 03, 05 |
| 14 | `14_MEDIA_LIBRARY_LIST.sql` | Listado de material por actor (biblioteca de media) | 03, 07 |
| 15 | *(no existe)* | Hueco de numeración: no hay archivo ni instalación pendiente | — |
| 16 | `16_MEDIA_ACTOR_GUARD.sql` | `sp_media_actor_busy` (guarda por actor) | 07, 09 |
| 17 | `17_VIDEO_LADDER.sql` | Escalera de vídeo (`short`, `feed_video`…) **y ALTER de `v_media_ready_payload`** | **12** |
| 18 | `18_QUEUE_RESILIENCE.sql` | `next_attempt_at`, `dead_letter`, reaper, reintento aplazado, `v_media_actor_inflight`, `v_media_queue_health` | 03, 09 |
| 19 | `19_JOB_LEASE_HEARTBEAT.sql` | Latido del lease del job | 18 |
| 20 | `20_EVENT_MESSAGE_CAP.sql` | Tope de mensaje en el log de eventos | 03 |
| 21 | `21_EVENT_CODE_INDEX.sql` | Índice por `event_code` en el log de eventos | 20 |
| 22 | `22_CAPACITY_HONEST_GUARD.sql` | Guarda honesta, carril de audio en la cola, retiro de residuos | 16, 17, 18 |
| 23 | `23_READY_PAYLOAD_METADATA_AUDIO.sql` | **Definición FINAL** de `v_media_ready_payload` (superset de 06/12/17 + `avatar`, `story`, `audio`) y de `sp_media_get_ready_payload` | 12, 13, 17 |
| 24 | `24_QUEUE_INTEGRITY.sql` | `ux_me_job_active_media` (un pipeline activo por media), dedupe en `sp_media_original_register`, guarda de media terminal en `sp_media_job_pick_next`, `sp_media_job_purge_terminated` | 07, 09, 22 |
| 25 | `25_TRANSVERSAL_METADATA_COLUMNS.sql` | Crea/ensancha `channel` (40), `post_id`/`sponsor_id`/`user_id` (80) en `media_request` y `media_rights_origin` | 23 |

**Instalación limpia:** la 25 debe aplicarse **antes de la 12**, porque la 12 crea
la vista que ya referencia `r.channel` y la tabla no lo tenía: hasta el 2026-11-01
esas cuatro columnas las creaba un DDL del repositorio del cliente. La 25 es
idempotente, así que en una base ya instalada basta con aplicarla al final.

### Dependencia que rompe la reinstalación — 06 → 12 → 17 → 23

Los cuatro archivos redefinen la MISMA vista `me.v_media_ready_payload` y **el
último gana**. La vista nace en 06; la 12 le añade la metadata transversal
(`channel`, `post_id`, `sponsor_id`, `user_id`); la 17 le añade el ladder de vídeo
(`short`, `feed_video`, `video_720`, `video_1080`) **y borra la metadata de la 12**
al no conocerla; la 23 publica la definición final, que es superset de las tres
—metadata + ladder + `avatar_url` + `story_url` + `audio_url`— conservando las 28
columnas originales en su orden y añadiendo las nuevas al final.

Consecuencia de invertir el orden: si 17 corre después de 23, la definición de 17
reemplaza a la final y **el payload deja de publicar metadata y audio**. El
síntoma es un audio `ready` con el archivo en disco y `audio_url` nulo en el
cliente, y un post editorial sin `channel`/`post_id` con los que el host lo
correlaciona.

**Regla:** cualquier migración futura que redefina esa vista debe partir de
`23_READY_PAYLOAD_METADATA_AUDIO.sql`, no de 06, 12 ni 17.

### 22 no reescribe el modelo, lo corrige

La 22 **no** vuelve a declarar tablas ni catálogos: retira residuos
(`processing_job.channel/post_id/sponsor_id/user_id`, `ix_me_job_next`) y
reemplaza dos procedimientos (`sp_media_actor_busy`, `sp_media_job_pick_next`).
Es la única migración pensada para ejecutarse sobre una instalación en
producción sin reinstalar el modelo.

---

## Verificación después de instalar

```sql
-- 1. La base responde y el esquema existe
SELECT COUNT(*) FROM me.media_request;

-- 2. Las dos piezas que la 18 aporta al modelo
SELECT COL_LENGTH('me.processing_job','next_attempt_at'),
       COL_LENGTH('me.processing_job','dead_letter');

-- 3. Un solo índice de cola
SELECT name FROM sys.indexes
WHERE object_id = OBJECT_ID('me.processing_job') AND name LIKE 'ix_me_job%';
-- esperado: ix_me_job_queue, ix_me_job_media (NO ix_me_job_next)

-- 4. El audio está declarado en catálogo y en el CHECK
SELECT variant_code FROM me.media_variant_catalog WHERE media_type = N'audio';

-- 5. El ladder de vídeo sobrevivió a la reinstalación
SELECT OBJECT_DEFINITION(OBJECT_ID('me.v_media_ready_payload'))
WHERE OBJECT_DEFINITION(OBJECT_ID('me.v_media_ready_payload')) LIKE '%feed_video%';
-- esperado: una fila. Vacío = se instaló 17 después de 23.

-- 6. La guarda se rinde ante un actor sin identidad
EXEC me.sp_media_actor_busy @source_actor_id = N'unknown';
-- esperado: busy = 0, identity_missing = 1

-- 7. El payload final tiene 36 columnas y publica audio + metadata
SELECT COUNT(*) AS columnas FROM sys.columns
WHERE object_id = OBJECT_ID('me.v_media_ready_payload');
-- esperado: 36
SELECT name FROM sys.columns
WHERE object_id = OBJECT_ID('me.v_media_ready_payload')
  AND name IN (N'audio_url', N'audio_preview_url', N'avatar_url', N'story_url',
               N'channel', N'post_id', N'sponsor_id', N'user_id');
-- esperado: 8 filas

-- 8. Un solo pipeline activo por media (migración 24)
SELECT name FROM sys.indexes
WHERE object_id = OBJECT_ID('me.processing_job') AND name = N'ux_me_job_active_media';
-- esperado: una fila
```

---

## Operación: escala de workers y retención de cola

**La cola admite varios procesos en paralelo sin coordinación externa.**
`sp_media_job_pick_next` reserva con `UPDLOCK, READPAST, ROWLOCK`, así que dos
workers nunca toman el mismo job: el segundo ve el hueco y sigue. No hace falta
broker, Redis ni elección de líder. Cada proceso sólo necesita un
`ME_WORKER_ID` distinto (por omisión se deriva de host + pid).

Presupuesto de CPU por proceso (variables de `config.worker`):

| Variable | Defecto | Efecto |
|---|---|---|
| `ME_WORKER_VIDEO_CONCURRENCY` | 2 | FFmpeg simultáneos de vídeo. Es el recurso caro: cada transcodificación satura un núcleo. |
| `ME_WORKER_JOB_CONCURRENCY` | 2 | Jobs de imagen/perfil en vuelo. |
| `ME_WORKER_AUDIO_CONCURRENCY` | 6 | Carril rápido de audio: `ffprobe` y referencia al original, sin recodificar. |
| `ME_WORKER_DRAIN_WHEN_FULL` | true | Al llenarse los carriles, vuelve a empezar en vez de esperar el poll. |

Regla práctica: `workers × ME_WORKER_VIDEO_CONCURRENCY ≤ núcleos − 1`. En un host
de 4 vCPU, `1 × 2` deja aire; `2 × 2` ya compite con el API y con SQL Server. Para
crecer en serio, el siguiente salto no es subir la concurrencia de vídeo en el
mismo host sino poner workers en otra máquina compartiendo la misma base.

**Retención.** `me.processing_job` no tenía purga y al 2026-11-01 acumulaba
116.109 filas, 115.979 terminadas —111.567 de ellas residuo de un bucle de
encolado sobre dos media de prueba—. La migración 24 añade
`sp_media_job_purge_terminated`, y el worker la invoca cada
`ME_WORKER_JOB_RETENTION_INTERVAL_MS` (6 h) borrando lotes de
`ME_WORKER_JOB_RETENTION_BATCH` (5,000) jobs terminados con más de
`ME_WORKER_JOB_RETENTION_DAYS` (7) días. `0` desactiva la purga.

El payload **no** depende de `processing_job`: vive en `me.media_request` +
`me.media_variant`, así que drenar jobs terminados no elimina ninguna URL.

