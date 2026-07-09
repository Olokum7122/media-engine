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
 *   - No autentica ni autoriza (futuro: middleware de admin)
 *
 * ENDPOINTS:
 *   GET /api/admin/services  — Lista servicios registrados con sus adaptadores
 *   GET /api/admin/health    — Health check detallado (estado del worker, BD, etc.)
 *
 * REFERENCIAS:
 *   - serviceRegistry.js → listServices()
 *   - index.js → monta adminRoutes bajo app.use()
 * ══════════════════════════════════════════════════════════════════════════════
 */

const { Router } = require('express');
const serviceRegistry = require('../services/serviceRegistry');

const router = Router();

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

module.exports = router;
