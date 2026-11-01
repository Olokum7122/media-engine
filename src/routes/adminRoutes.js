'use strict';

/**
 * adminRoutes.js — Rutas administrativas del Media Engine V3
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMINIO:      ATLX Media Engine — Administración y diagnóstico
 * RESPONSABLE:  Exponer endpoints de administración del engine
 *
 * NO HACE:
 *   - No procesa media (lo hace mediaProcessorV3)
 *   - No expone endpoints de cliente (lo hace mediaRoutes)
 *   - No altera el estado de jobs: este módulo es de SÓLO LECTURA
 *
 * ENDPOINTS (todos bajo el guard de `adminAuth`, ver más abajo):
 *   GET /api/admin/services  — Lista servicios registrados con sus adaptadores
 *   GET /api/admin/health    — Health check detallado (estado del worker, BD, etc.)
 *   GET /api/admin/queue     — Estado real de la cola (vía me.sp_media_queue_stats)
 *
 * AUTENTICACIÓN:
 *   Cabecera `x-admin-token` con el valor de `ME_ADMIN_TOKEN`. Es un secreto
 *   COMPARTIDO server-to-server (GT), no una credencial de cliente.
 *
 *   MEDIDO 2026-10-31: antes de este guard el engine no autenticaba NADA. El
 *   guard de CORS de index.js sólo rechaza peticiones que traen `Origin`
 *   ajeno; toda petición server-to-server (sin `Origin`) pasaba con 200. Los
 *   endpoints admin no estaban expuestos a Internet (nginx no enruta
 *   /api/admin y el firewall cierra :4100), pero cualquier proceso del propio
 *   host los leía sin credencial alguna.
 *
 *   Si `ME_ADMIN_TOKEN` NO está configurado el módulo responde 503 en lugar de
 *   servir datos: un fallo de configuración se declara, no se convierte en un
 *   endpoint abierto.
 *
 * REFERENCIAS:
 *   - serviceRegistry.js → listServices()
 *   - variantService.js  → queueStats()
 *   - config.js          → admin.token
 *   - index.js → monta adminRoutes bajo app.use()
 * ══════════════════════════════════════════════════════════════════════════════
 */

const { Router } = require('express');
const crypto = require('crypto');
const serviceRegistry = require('../services/serviceRegistry');
const config = require('../config');
const router = Router();

/**
 * Compara dos cadenas sin filtrar por tiempo la posición del primer byte
 * distinto. `timingSafeEqual` exige longitudes iguales, así que se comparan
 * los digests: mismo coste para cualquier longitud de entrada.
 */
function sameSecret(received, expected) {
  const a = crypto.createHash('sha256').update(received).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Guard del contrato administrativo. Se aplica a TODO el módulo: health y
 * services también describen el interior del servicio y no son públicos.
 */
router.use((req, res, next) => {
  const expected = config.admin.token;

  if (!expected) {
    return res.status(503).json({
      error: 'admin_auth_not_configured',
      message: 'ME_ADMIN_TOKEN no está configurado en el engine: el contrato administrativo no se sirve sin autenticación.',
    });
  }

  const received = String(req.headers[config.admin.headerName] || '');
  if (!received || !sameSecret(received, expected)) {
    return res.status(401).json({
      error: 'admin_unauthorized',
      message: `Se requiere la cabecera ${config.admin.headerName} válida para el contrato administrativo.`,
    });
  }

  return next();
});

/**
 * GET /api/admin/services — Lista servicios registrados
 */
router.get('/api/admin/services', (_req, res) => {
  const services = serviceRegistry.listServices();
  res.json({
    count: services.length,
    services,
  });
});

/**
 * GET /api/admin/health — Health check detallado
 */
router.get('/api/admin/health', async (_req, res) => {
  let dbStatus = 'unknown';
  try {
    const { getPool } = require('../db');
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    service: 'Atlx_MediaEngine_V3',
    version: '3.0.0',
    uptime: process.uptime(),
    db: dbStatus,
    services: serviceRegistry.listServices(),
  });
});

/**
 * GET /api/admin/queue — Estado real de la cola de procesamiento
 *
 * Profundidad, trabajos aplazados por backoff, en vuelo por worker, antigüedad
 * del pendiente más viejo y dead-letter. Sin esto, una cola que crece es
 * invisible hasta que un usuario se queja.
 */
router.get('/api/admin/queue', async (_req, res) => {
  try {
    const variantService = require('../services/mediaEngine/variantService');
    const stats = await variantService.queueStats();
    res.json({
      ...stats,
      worker: {
        id: config.workerId,
        jobConcurrency: config.worker.jobConcurrency,
        videoConcurrency: config.worker.videoConcurrency,
        videoPreset: config.worker.videoPreset,
      },
      // Marca de tiempo del ENGINE, no del consumidor: permite a GT detectar
      // cuándo la lectura es vieja aunque su propio reloj esté bien.
      observed_at: new Date().toISOString(),
    });
  } catch (err) {
    // El error se registra aquí y NO se propaga al consumidor: el mensaje de
    // errores de `mssql` incluye host, instancia y a veces el texto del SQL.
    console.error(`[admin/queue] Error consultando la cola: ${err.message}`);
    res.status(503).json({
      error: 'queue_unavailable',
      message: 'No fue posible leer el estado de la cola en este momento.',
    });
  }
});

module.exports = router;
