'use strict';

/**
 * config.js — Configuración centralizada del Media Engine V3.
 * Carga variables del .env y expone objetos de configuración.
 */

const path = require('path');

// Cargar dotenv desde la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: false });

const config = {
  // Puerto del servidor Express
  port: parseInt(process.env.ME_PORT || process.env.PORT || '4100', 10),

  // Límite JSON
  jsonLimit: process.env.ME_JSON_LIMIT || '50mb',

  // Base URL para URLs de media
  mediaBaseUrl: (process.env.ME_MEDIA_BASE_URL || 'http://localhost:4100').replace(/\/+$/, ''),

  // Directorio de uploads
  uploadsDir: path.resolve(__dirname, '..', process.env.ME_UPLOADS_DIR || './uploads'),

  // SQL Server - Media Engine Database
  sql: {
    server: process.env.ME_SQL_HOST || '185.187.235.253',
    port: parseInt(process.env.ME_SQL_PORT || '1433', 10),
    user: process.env.ME_SQL_USER || 'sa',
    password: process.env.ME_SQL_PASSWORD || '',
    database: process.env.ME_SQL_DATABASE || 'Atlx_Mediaengine',
    options: {
      encrypt: (process.env.ME_SQL_ENCRYPT || 'false').toLowerCase() === 'true',
      trustServerCertificate: (process.env.ME_SQL_TRUST_SERVER_CERT || 'true').toLowerCase() === 'true',
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },

  // Normalización de contenedores HEIF/HEVC.
  //
  // Los binarios precompilados de `sharp` traen libheif SIN el plugin HEVC: leen
  // la cabecera del contenedor pero no lo decodifican, y el formato nativo de la
  // cámara del iPhone es `image/heic`. El motor delega esa decodificación en
  // `heif-convert` (paquete libheif-examples + libheif-plugin-libde265), y el
  // binario se declara aquí para poder moverlo sin tocar código.
  media: {
    heifConvertBin: process.env.ME_HEIF_CONVERT_BIN || 'heif-convert',
    heifConvertTimeoutMs: parseInt(process.env.ME_HEIF_CONVERT_TIMEOUT_MS || '120000', 10),
  },

  // Worker
  worker: {
    pollIntervalMs: parseInt(process.env.ME_WORKER_POLL_INTERVAL_MS || '3000', 10),
    // Techo de jobs reservados por ciclo. El default histórico (3) fijaba el
    // rendimiento en 3 jobs / 15 s = 12 por minuto, y ninguna concurrencia podía
    // superarlo porque el ciclo sólo miraba `maxBatch` filas. Ahora se calcula
    // como `videoConcurrency + audioConcurrency` salvo que este valor sea menor.
    maxBatch: parseInt(process.env.ME_WORKER_MAX_BATCH || '8', 10),
    // Techo REAL de ejecución de un transcode. Lo aplica _transcodeVideo matando
    // el proceso de ffmpeg; sin esto un video colgado detiene la cola completa.
    videoTimeoutMs: parseInt(process.env.ME_WORKER_VIDEO_TIMEOUT_MS || '300000', 10),
    // Un job en `running` con el lock más viejo que esto es huérfano: el worker
    // murió o el proceso quedó colgado. El reaper lo devuelve a `pending`.
    staleJobMinutes: parseInt(process.env.ME_WORKER_STALE_JOB_MINUTES || '10', 10),
    // Latido del lease. Sin él, `locked_at` se escribía una sola vez al reservar
    // el job y el reaper no distinguía "worker muerto" de "transcode lento": un
    // video cuya suma de variantes pasaba de `staleJobMinutes` se devolvía a la
    // cola mientras ffmpeg seguía vivo y el mismo media se procesaba dos veces.
    // Con el latido cada 60s, un lock de más de 10 min ya sólo puede significar
    // que el worker dejó de latir.
    heartbeatMs: parseInt(process.env.ME_WORKER_HEARTBEAT_MS || '60000', 10),
    // Ventana para que un `received` reciba bytes. Pasada esta edad se expira,
    // de modo que una subida abandonada no bloquee al actor para siempre.
    uploadAbandonMinutes: parseInt(process.env.ME_WORKER_UPLOAD_ABANDON_MINUTES || '30', 10),
    // Preset de x264. `medium` es el valor histórico; `veryfast` reduce de forma
    // notable el tiempo de CPU por variante. Es palanca de medición, no cambio
    // de comportamiento: el default se conserva.
    videoPreset: process.env.ME_WORKER_VIDEO_PRESET || 'medium',
    // Transcodes de video simultáneos. El host tiene 4 vCPU y comparte máquina
    // con el Gateway y las APIs: 2 aprovecha núcleos ociosos sin dejarlos sin
    // CPU; los hilos de x264 se reparten entre los transcodes en vuelo.
    videoConcurrency: parseInt(process.env.ME_WORKER_VIDEO_CONCURRENCY || '2', 10),
    // Jobs simultáneos. `maxBatch` decía cuántos jobs mirar por ciclo, pero el
    // ciclo los esperaba uno tras otro: la cola avanzaba a un video por vez.
    // Este límite es la concurrencia REAL de la cola y comparte presupuesto de
    // CPU con videoConcurrency (dos videos en paralelo ya son 2 hilos x264).
    jobConcurrency: parseInt(process.env.ME_WORKER_JOB_CONCURRENCY || '2', 10),
    // Carril rápido de audio. Un audio NO se transcodifica: se mide con
    // `ffprobe` y se publica apuntando al original, así que cuesta decenas de
    // milisegundos y no consume CPU de codificación. Compartir presupuesto con
    // el vídeo lo condenaría a esperar detrás de cada transcodificación de 3-4
    // minutos; con 6 carriles simultáneos, cien audios de Colaborattor salen en
    // el tiempo que tarda un solo short.
    audioConcurrency: parseInt(process.env.ME_WORKER_AUDIO_CONCURRENCY || '6', 10),
    // Al llenarse todos los carriles, el ciclo vuelve a empezar de inmediato en
    // lugar de esperar el siguiente poll. Sin esto la cola avanzaba en ráfagas
    // del tamaño del lote y la concurrencia quedaba ociosa entre ráfagas.
    drainWhenFull: (process.env.ME_WORKER_DRAIN_WHEN_FULL || 'true').toLowerCase() !== 'false',
    // Backoff exponencial del reintento: base * 2^(attempts-1), con tope. Sin
    // esto un job que falla por timeout se reintenta en el mismo ciclo y el
    // reintento no sirve de nada porque la causa sigue presente.
    retryBaseDelaySeconds: parseInt(process.env.ME_WORKER_RETRY_BASE_DELAY_SECONDS || '30', 10),
    retryMaxDelaySeconds: parseInt(process.env.ME_WORKER_RETRY_MAX_DELAY_SECONDS || '900', 10),
    // Retención de jobs TERMINADOS (done/failed/canceled/dead_letter).
    // `me.processing_job` no tenía purga: al 2026-11-01 acumulaba 116.109 filas,
    // 115.979 terminadas, de las cuales 111.567 eran el residuo de un bucle de
    // encolado de dos media de prueba. El payload NO depende de esta tabla
    // (vive en `me.media_variant` + `me.media_request`), así que drenarla es
    // mantenimiento, no pérdida de contrato.
    // `0` desactiva la purga por completo: nunca se borra por omisión.
    jobRetentionDays: parseInt(process.env.ME_WORKER_JOB_RETENTION_DAYS || '7', 10),
    jobRetentionIntervalMs: parseInt(process.env.ME_WORKER_JOB_RETENTION_INTERVAL_MS || '21600000', 10),
    jobRetentionBatchSize: parseInt(process.env.ME_WORKER_JOB_RETENTION_BATCH || '5000', 10),
  },

  // Guarda de concurrencia por actor: una publicación en vuelo a la vez.
  guard: {
    enabled: (process.env.ME_GUARD_ENABLED || 'true').toLowerCase() !== 'false',
    staleReceivedMinutes: parseInt(process.env.ME_GUARD_STALE_RECEIVED_MINUTES || '10', 10),
    retryAfterSeconds: parseInt(process.env.ME_GUARD_RETRY_AFTER_SECONDS || '15', 10),
  },

  // Worker identity (for job locking)
  workerId: process.env.ME_WORKER_ID || `worker-${require('os').hostname()}-${process.pid}`,

  // ─── Contrato administrativo ──────────────────────────────────────────────
  // El engine expone /api/admin/* a consumidores server-to-server (GT). Hasta
  // ahora esos endpoints NO tenían autenticación: el guard de CORS sólo filtra
  // peticiones de navegador, y una petición sin cabecera `Origin` —cualquier
  // proceso del propio host, un SSRF o un curl— atravesaba el guard entero.
  //
  // El token es COMPARTIDO con GT (que corre en el mismo servidor) y NO es una
  // credencial de cliente: los clientes de media siguen entrando por
  // `mediaRoutes`, que no se toca en este cambio.
  admin: {
    token: (process.env.ME_ADMIN_TOKEN || '').trim(),
    headerName: 'x-admin-token',
  },
};

module.exports = config;
