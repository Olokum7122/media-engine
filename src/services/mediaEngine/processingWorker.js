'use strict';

/**
 * processingWorker.js — Worker de procesamiento background V3.
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMINIO:      Media Engine — Pipeline de procesamiento background multi-servicio
 * RESPONSABLE:  Orquestar el ciclo completo: pick job → process → mark ready
 *
 * NO HACE:
 *   - No expone endpoints HTTP (lo hace mediaRoutes)
 *   - No decide políticas de derechos (lo hace policyEvaluator)
 *   - No conoce de posts, sponsors ni ningún servicio en específico
 *     (consulta serviceRegistry para adaptadores por sourceApp)
 *   - No ejecuta múltiples workers simultáneos (usa worker locking)
 *
 * PIPELINE:
 *   pick_next_job → mark_running → evaluate_policy →
 *   detect_orientation → resolve_profile (vía serviceRegistry) →
 *   generate_variants → upsert_variants → mark_ready
 *
 * PERFILES:
 *   El processing_profile_code se resuelve así:
 *     1. Si media_request ya tiene processing_profile_code → usarlo
 *     2. Si no → serviceRegistry.getChannelProfileMapper(sourceApp).resolveProfile()
 *     3. Si no hay mapper → 'standard' (compatibilidad)
 *
 * REFERENCIAS:
 *   - serviceRegistry.js → getChannelProfileMapper(sourceApp)
 *   - mediaProcessorV3.js → processImage / processVideo
 *   - variantService.js → upsertVariant / markReady
 *   - apps-antojados/docs/feed.md (Sección 9: Perfiles de procesamiento)
 * ══════════════════════════════════════════════════════════════════════════════
 */

const config = require('../../config');
const variantService = require('./variantService');
const requestService = require('./requestService');
const rightsService = require('./rightsService');
const policyEvaluator = require('./policyEvaluator');
const mediaProcessor = require('./mediaProcessorV3');
const originalService = require('./originalService');
const actorGuardService = require('./actorGuardService');
const serviceRegistry = require('../serviceRegistry');

let timer = null;
let running = false;
// Marca del último ciclo de retención (migración 24). En 0 para que la primera
// pasada ocurra al arrancar y luego respete `jobRetentionIntervalMs`.
let lastRetentionAt = 0;

function start() {
  if (timer) return;
  console.log(`[processingWorker] Iniciado, polling cada ${config.worker.pollIntervalMs / 1000}s`);
  timer = setInterval(cycle, config.worker.pollIntervalMs);
  cycle(); // primer ciclo inmediato
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('[processingWorker] Detenido');
  }
}

// ─── Clasificación de fallos ────────────────────────────────────────────────
//
// El motor trataba igual un timeout, un deadlock y un HEIC que `sharp` no sabe
// decodificar: todo terminaba en `failed` definitivo. Reintentar un archivo
// corrupto sólo quema CPU y alarga la cola; no reintentar un timeout pierde un
// trabajo que iba a salir bien. Estas dos listas separan ambos mundos.
//
// El default es REINTENTABLE con techo (`max_attempts`, 3 por defecto): un fallo
// desconocido merece un intento más, nunca un bucle.
const PERMANENT_FAILURES = [
  { re: /No decoding plugin|heif|compression format/i, code: 'UNSUPPORTED_MEDIA' },
  { re: /Invalid data|bad seek|moov atom not found|could not find codec|unsupported codec/i, code: 'UNSUPPORTED_MEDIA' },
  { re: /conflicted with the CHECK constraint|Invalid column name/i, code: 'CONTRACT_MISMATCH' },
  { re: /Archivo original no encontrado|Original no registrado|Media request no encontrado/i, code: 'ORIGINAL_MISSING' },
  { re: /Tipo de media no soportado/i, code: 'UNSUPPORTED_MEDIA_TYPE' },
];

const TRANSIENT_FAILURES = [
  { re: /timed out|timeout|ETIMEDOUT/i, code: 'PROCESSING_TIMEOUT' },
  { re: /deadlock|was deadlocked/i, code: 'DB_DEADLOCK' },
  { re: /ECONNRESET|ECONNREFUSED|ESOCKET|Connection lost|ConnectionError/i, code: 'DB_UNREACHABLE' },
  { re: /ENOSPC|no space left/i, code: 'DISK_FULL' },
];

function _classifyFailure(err) {
  const msg = String((err && err.message) || err || '');

  for (const rule of PERMANENT_FAILURES) {
    if (rule.re.test(msg)) return { retryable: false, errorCode: rule.code };
  }
  for (const rule of TRANSIENT_FAILURES) {
    if (rule.re.test(msg)) return { retryable: true, errorCode: rule.code };
  }
  return { retryable: true, errorCode: 'PROCESSING_ERROR' };
}

/**
 * Ejecuta `fn` sobre `items` con `limit` promesas en vuelo.
 */
async function _runWithConcurrency(items, limit, fn) {
  const resultados = new Array(items.length);
  let siguiente = 0;

  const runner = async () => {
    while (true) {
      const i = siguiente++;
      if (i >= items.length) return;
      resultados[i] = await fn(items[i]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, limit), items.length) }, runner)
  );
  return resultados;
}

async function cycle() {
  if (running) return; // evitar solapamiento
  running = true;
  let drenar = false;

  try {
    // 0. Reclamar trabajo huérfano antes de tomar jobs nuevos. Sin esto, un
    //    transcode que muere deja el job en `running` y la fila del media en
    //    `processing` para siempre: el actor queda bloqueado por la guarda y
    //    el pipeline no vuelve a tocarlo nunca.
    try {
      const reaped = await actorGuardService.reapStale();
      if (reaped.jobsRequeued || reaped.requestsFailed || reaped.requestsExpired) {
        console.warn('[processingWorker] Reaper:', JSON.stringify(reaped));
      }
    } catch (reapErr) {
      // El reaper nunca debe impedir el ciclo normal.
      console.error('[processingWorker] Reaper falló:', reapErr.message);
    }

    // 0.b Retención de jobs terminados, acotada por intervalo. No es parte del
    //     ciclo de publicación: si tarda o falla, la cola sigue. Se ejecuta por
    //     lotes y se detiene en cuanto un lote devuelve 0, para no convertir el
    //     mantenimiento en una transacción larga que compita con los jobs.
    if (config.worker.jobRetentionDays > 0 &&
        Date.now() - lastRetentionAt >= config.worker.jobRetentionIntervalMs) {
      lastRetentionAt = Date.now();
      try {
        let total = 0;
        for (let i = 0; i < 4; i += 1) {
          const { deleted } = await variantService.purgeTerminatedJobs(
            config.worker.jobRetentionDays,
            config.worker.jobRetentionBatchSize
          );
          total += deleted;
          if (!deleted) break;
        }
        if (total > 0) {
          console.warn('[processingWorker] Retención:', total, 'jobs terminados purgados');
        }
      } catch (retErr) {
        // Igual que el reaper: el mantenimiento no puede tumbar el pipeline.
        console.error('[processingWorker] Retención falló:', retErr.message);
      }
    }

    // 1. Dos carriles sobre la MISMA cola. `pickNextJob` reserva de forma
    //    atómica (UPDLOCK/READPAST), así que reservar ya saca el job de la cola:
    //    si el proceso muere aquí, el reaper lo devuelve.
    //
    //    El reparto no es cosmético. El audio se resuelve con `ffprobe` y sin
    //    transcodificar (decenas de ms), mientras un vídeo paga 3-4 transcodes
    //    de minutos. Con una sola cola FIFO, cada audio de Colaborattor espera
    //    detrás de todos los shorts en vuelo.
    const audioLane = Math.max(1, config.worker.audioConcurrency);
    const generalLane = Math.max(1, config.worker.jobConcurrency);
    const totalSlots = Math.max(1, Math.min(config.worker.maxBatch, audioLane + generalLane));

    const audioJobs = [];
    while (audioJobs.length < Math.min(audioLane, totalSlots)) {
      const job = await variantService.pickNextJob({ mediaType: 'audio' });
      if (!job) break; // no hay audio elegible
      audioJobs.push(job);
    }

    const generalJobs = [];
    while (generalJobs.length < generalLane &&
           audioJobs.length + generalJobs.length < totalSlots) {
      const job = await variantService.pickNextJob({ excludeMediaType: 'audio' });
      if (!job) break; // no hay más trabajo general elegible
      generalJobs.push(job);
    }

    const jobs = [...audioJobs, ...generalJobs];
    if (!jobs.length) return;

    // 2. Un pool por carril: varios audios y pocos vídeos en vuelo a la vez, no
    //    N jobs de cualquier tipo. Los carriles se ejecutan en paralelo, de modo
    //    que un transcode lento no retiene el carril de audio.
    const lleno = jobs.length >= totalSlots;
    await Promise.all([
      _runWithConcurrency(audioJobs, audioLane, processJob),
      _runWithConcurrency(generalJobs, generalLane, processJob),
    ]);

    // 3. Si el lote se llenó, quedarse trabajando en vez de esperar el poll.
    //    Sin esto el techo real era `batch / poll` y la concurrencia pasaba
    //    ociosa entre ráfagas.
    drenar = lleno && config.worker.drainWhenFull;
  } catch (err) {
    console.error('[processingWorker] Error en ciclo:', err.message);
  } finally {
    running = false;
    if (drenar) setImmediate(cycle);
  }
}

async function processJob(job) {
  const { job_id: jobId, media_id: mediaId, job_type: jobType } = job;
  console.log(`[processingWorker] Procesando job_id=${jobId}, media_id=${mediaId}, type=${jobType}`);

  let lease = null;
  // Original ya normalizado (HEIC → JPEG temporal) cuando el media es imagen.
  // El temporal debe borrarse al cerrar el job, salga bien o falle.
  let prepared = null;

  try {
    // 1. Marcar job como running
    await variantService.markJobRunning(jobId);

    // 1.b Latido del lease. El reaper reclama un job `running` cuyo `locked_at`
    //     superó `staleJobMinutes`; sin renovarlo, un transcode legítimo más
    //     largo que ese horizonte se devolvía a la cola mientras ffmpeg seguía
    //     vivo y el mismo media se procesaba dos veces.
    lease = _startLeaseHeartbeat(jobId);

    // 2. Obtener metadata del media request
    const mediaRequest = await requestService.getById(mediaId);
    if (!mediaRequest) {
      throw new Error(`Media request no encontrado: ${mediaId}`);
    }

    // 3. Evaluar política de derechos (nunca bloquea)
    const policy = await policyEvaluator.evaluate(mediaId);
    // policy.canProcess siempre es true (fail open)
    const applyWatermark = policy.shouldApplyEngineWatermark;
    const watermarkProfileCode = policy.watermarkProfileCode || null;

    // 4. Obtener datos del original (solo para metadata)
    const rights = await rightsService.getRightsOrigin(mediaId);

    // 5. Determinar ruta del archivo original
    const original = await _getOriginalRecord(mediaId);
    if (!original || !original.original_storage_path) {
      throw new Error(`Original no registrado para media_id=${mediaId}`);
    }

    const rawPath = original.original_storage_path;
    if (!require('fs').existsSync(rawPath)) {
      throw new Error(`Archivo original no encontrado: ${rawPath}`);
    }

    // 6. Detectar orientación del original (si es imagen)
    //    `sharp().metadata()` devuelve una Promise: sin `await`, metadata.width
    //    es undefined y _detectOrientation resolvía siempre 'square', de modo
    //    que ningún perfil portrait_*/landscape_* llegaba a aplicarse.
    //
    //    Un HEIC de iPhone no lo decodifica `sharp` (ver prepareImageSource):
    //    sin normalizarlo aquí, la orientación quedaba en null y una foto
    //    vertical acababa con el perfil `standard` en vez de `portrait_standard`.
    //    La ruta preparada se conserva y se pasa al procesador para no convertir
    //    el mismo archivo dos veces.
    let orientation = null;
    if (mediaRequest.media_type === 'image') {
      try {
        prepared = await mediaProcessor.prepareImageSource(rawPath);
        const metadata = await require('sharp')(prepared.path).metadata();
        orientation = _detectOrientation(metadata.width, metadata.height);
      } catch (err) {
        console.warn(`[processingWorker] Orientación no detectada media_id=${mediaId}:`, err.message);
        orientation = null;
      }
    }

    // 7. Resolver processing_profile_code
    //    Prioridad: 1) explícito en request, 2) channelProfileMapper del servicio, 3) 'standard'
    let profileCode = mediaRequest.processing_profile_code || null;
    if (!profileCode || profileCode === 'standard') {
      const channelProfileMapper = serviceRegistry.getChannelProfileMapper(mediaRequest.source_app);
      if (channelProfileMapper && typeof channelProfileMapper.resolveProfile === 'function') {
        profileCode = channelProfileMapper.resolveProfile({
          channel: mediaRequest.external_context_id || null,
          mediaType: mediaRequest.media_type,
          orientation,
          targetContext: mediaRequest.target_context,
        }) || 'standard';
      } else {
        profileCode = 'standard';
      }
    }

    // 8. Determinar ruta del watermark según el perfil resuelto
    const watermarkPath = applyWatermark && watermarkProfileCode
      ? await _getWatermarkPathForProfile(watermarkProfileCode)
      : null;

    let result;
    if (mediaRequest.media_type === 'image') {
      result = await mediaProcessor.processImage(rawPath, mediaId, {
        applyWatermark, watermarkPath, processingProfileCode: profileCode,
        sourceImagePath: prepared ? prepared.path : undefined,
      });
    } else if (mediaRequest.media_type === 'video') {
      result = await mediaProcessor.processVideo(rawPath, mediaId, {
        applyWatermark, watermarkPath, processingProfileCode: profileCode,
      });
    } else if (mediaRequest.media_type === 'audio') {
      // El audio fuente no se transcodea ni se duplica: se declara la variante
      // pública 'audio_full' apuntando al original ya archivado.
      result = await mediaProcessor.processAudio(rawPath, mediaId, {
        processingProfileCode: profileCode,
      });
    } else {
      throw new Error(`Tipo de media no soportado: ${mediaRequest.media_type}`);
    }

    // Propagar orientación detectada
    if (!result.orientation && orientation) {
      result.orientation = orientation;
    }

    // 8.b Si el lease se perdió durante el transcode, el job ya tiene otro
    //     dueño: persistir estas variantes las haría chocar con las suyas.
    if (lease && lease.lost()) {
      throw new Error(`LEASE_LOST: el reaper reclamó job_id=${jobId} durante el procesamiento`);
    }

    // 9. Actualizar metadata del original (dimensiones, sha256)
    await originalService.registerOriginal({
      mediaId,
      originalStoragePath: original.original_storage_path,
      originalUrl: original.original_url,
      mimeType: original.mime_type,
      extension: original.extension,
      sizeBytes: original.size_bytes,
      width: result.width,
      height: result.height,
      durationMs: result.durationMs || null,
      orientation: result.orientation,
      sha256Hash: result.sha256,
    });

    // 10. Registrar cada variante
    for (const variant of result.variants) {
      await variantService.upsertVariant(variant);
    }

    // 11. Marcar como ready
    const readyResult = await variantService.markReady(mediaId, jobId);
    console.log(`[processingWorker] Ready media_id=${mediaId}`);

    // 12. El original se conserva.
    //
    //     Borrarlo (como hacía esta rutina) dejaba `original_url` apuntando a un
    //     archivo inexistente: cualquier reproducción del original daba 404, y
    //     era irreversible para los reintentos de transcode y para la variante
    //     `audio_full`, que apunta al propio original. El parche se aplicó en
    //     producción el 2026-10-10 y ahora vive también en el repositorio.
    //     _deleteRaw(rawPath);

  } catch (err) {
    console.error(`[processingWorker] Error job_id=${jobId}:`, err.message);

    // Lease perdido: el job pertenece a otro worker y las transiciones las
    // decide él. Cerrarlo aquí por debajo lo dejaría fuera de su cola.
    if (String(err.message || '').startsWith('LEASE_LOST')) {
      console.warn(`[processingWorker] job_id=${jobId} sin transición: el job ya no pertenece a este worker`);
      return;
    }

    const { retryable, errorCode } = _classifyFailure(err);

    try {
      const outcome = await variantService.retryOrFail({
        mediaId,
        jobId,
        errorCode,
        // `me.media_event_log.event_message` es NVARCHAR(1000): un mensaje más
        // largo abortaba el INSERT y, con él, la transición del job. El job
        // quedaba en `running` y el request sin cerrar, de modo que el cliente
        // esperaba en vano hasta su propio timeout. Se recorta a 900 para dejar
        // margen a los prefijos que añade el SP.
        errorMessage: String(err.message || '').slice(0, 900),
        retryable,
      });

      if (outcome) {
        console.warn(
          `[processingWorker] job_id=${jobId} → ${outcome.job_status}` +
          (outcome.next_attempt_at ? ` (reintento en ${outcome.delay_seconds}s, intento ${outcome.attempts}/${outcome.max_attempts})` : '')
        );
      }
    } catch (dbErr) {
      // Si la política de reintento no está disponible (SP ausente), se degrada
      // al cierre terminal anterior: mejor un failed visible que un job colgado.
      console.error('[processingWorker] retryOrFail falló, cerrando terminal:', dbErr.message);
      try {
        await variantService.markFailed(mediaId, errorCode, err.message, jobId);
      } catch (failErr) {
        console.error('[processingWorker] Error al marcar failed en DB:', failErr.message);
      }
    }
  } finally {
    if (lease) lease.stop();
    if (prepared) {
      try { await prepared.cleanup(); } catch (e) { /* el temporal no rompe el cierre */ }
    }
  }
}

/**
 * Arranca el latido del lease de un job.
 *
 * Renueva `locked_at` cada `config.worker.heartbeatMs` para que el reaper no
 * confunda un transcode largo con un worker muerto. Devuelve un manejador con
 * `lost()` —consultado antes de persistir— y `stop()`.
 */
function _startLeaseHeartbeat(jobId) {
  let perdido = false;
  let enVuelo = false;

  const id = setInterval(async () => {
    if (enVuelo || perdido) return;
    enVuelo = true;
    try {
      const { renewed, status } = await actorGuardService.heartbeat(jobId, config.workerId);
      if (!renewed) {
        perdido = true;
        console.warn(`[processingWorker] Lease perdido job_id=${jobId} (estado actual: ${status || '?'})`);
      }
    } catch (err) {
      // Un latido fallido no aborta el transcode: el reaper tiene margen de
      // `staleJobMinutes` y el siguiente latido puede recuperar el lease.
      console.warn(`[processingWorker] Latido falló job_id=${jobId}:`, err.message);
    } finally {
      enVuelo = false;
    }
  }, config.worker.heartbeatMs);

  // El latido no debe mantener vivo el proceso si todo lo demás terminó.
  if (typeof id.unref === 'function') id.unref();

  return {
    lost: () => perdido,
    stop: () => clearInterval(id),
  };
}

async function _getOriginalRecord(mediaId) {
  const { getPool, sql } = require('../../db');
  const pool = await getPool();
  const result = await pool.request()
    .input('mediaId', sql.UniqueIdentifier, mediaId)
    .query('SELECT * FROM me.media_original WHERE media_id = @mediaId');
  return result.recordset[0] || null;
}

async function _getWatermarkPathForProfile(profileCode) {
  // Si el perfil es 'antojados_default', usar la imagen bitmap.png del engine
  if (profileCode === 'antojados_default') {
    const defaultPath = require('path').join(__dirname, '..', '..', 'assets', 'watermark', 'bitmap.png');
    if (require('fs').existsSync(defaultPath)) return defaultPath;
    console.warn('[processingWorker] Watermark bitmap.png no encontrado en:', defaultPath);
    return null;
  }

  // Otros perfiles: consultar en DB
  try {
    const { getPool, sql } = require('../../db');
    const pool = await getPool();
    const result = await pool.request()
      .input('code', sql.NVarChar(60), profileCode)
      .query('SELECT logo_storage_path FROM me.watermark_profile WHERE watermark_profile_code = @code AND is_active = 1');
    const profile = result.recordset[0];
    return profile?.logo_storage_path || null;
  } catch (err) {
    console.warn(`[processingWorker] Error al obtener watermark path para perfil ${profileCode}:`, err.message);
    return null;
  }
}

function _deleteRaw(rawPath) {
  try {
    if (rawPath && require('fs').existsSync(rawPath)) {
      require('fs').unlinkSync(rawPath);
    }
  } catch (e) {
    console.warn('[processingWorker] No se pudo borrar raw:', rawPath, e.message);
  }
}

function _detectOrientation(width, height) {
  if (!width || !height) return 'square';
  if (width > height) return 'landscape';
  if (width < height) return 'portrait';
  return 'square';
}

module.exports = { start, stop };
