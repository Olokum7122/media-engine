'use strict';

/**
 * ATLX Media Engine V3 — Punto de entrada principal.
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMINIO:      ATLX Media Engine — Procesamiento multimedia multi-servicio
 * RESPONSABLE:  Integrar API REST, worker background, servir archivos estáticos
 *
 * NO HACE:
 *   - No conoce de posts, sponsors ni usuarios (dominio de cada servicio)
 *   - No tiene lógica de negocio específica de Antojados o Explorer
 *   - No decide políticas de derechos (lo hace policyEvaluator)
 *
 * SERVICIOS REGISTRADOS:
 *   - antojados  → AntojadosMX (App Social + Negocios)
 *   - explorer   → Explorer App (Descubrimiento de lugares)
 *   - generic    → Fallback para servicios no registrados
 *
 * ENTRY POINTS:
 *   API:   GET /health, POST /api/media/requests, POST /api/media/:id/original, etc.
 *   Admin: GET /api/admin/services (lista servicios registrados)
 *
 * MODELO DE DATOS: media-engine/docs/ (tablas me.*)
 * ══════════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const mediaRoutes = require('./routes/mediaRoutes');
const adminRoutes = require('./routes/adminRoutes');
const processingWorker = require('./services/mediaEngine/processingWorker');
const serviceRegistry = require('./services/serviceRegistry');

// ─── Registro de servicios ──────────────────────────────────────────────────

// Servicio: AntojadosMX
const antojadosChannelProfileMapper = require('./adapters/antojados/channelProfileMapper');
const antojadosPackageMapper = require('./adapters/antojados/mediaPackageMapper');
serviceRegistry.registerService('antojados', {
  channelProfileMapper: antojadosChannelProfileMapper,
  mediaPackageMapper: antojadosPackageMapper,
});

// Servicio: Explorer App
serviceRegistry.registerService('explorer', {
  // Explorer usa perfiles standard por ahora
  channelProfileMapper: antojadosChannelProfileMapper, // comparte el perfil de Antojados
  mediaPackageMapper: antojadosPackageMapper,
});

// Servicio: Generic (fallback)
const genericProfileMapper = require('./adapters/generic/profileMapper');
serviceRegistry.registerService('generic', {
  channelProfileMapper: genericProfileMapper,
});

const app = express();

// ─── CORS restringido ──────────────────────────────────────────────────────
// El Media Engine solo acepta peticiones server-to-server. No debe ser
// consumido directamente desde navegadores. Solo orígenes conocidos.

const ALLOWED_ORIGINS = [
  'https://api.antojadosmx.mx',
  'http://localhost:8010',   // Antojados API (dev)
  'http://localhost:4101',   // Explorer API (dev)
  'http://localhost:4100',   // self (dev)
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next(); // Petición server-to-server (sin Origin header)

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  }

  // Origen no permitido: responder con error
  console.warn(`[CORS] Origen bloqueado: ${origin}`);
  res.status(403).json({ error: 'origin_not_allowed', message: 'El Media Engine solo acepta peticiones server-to-server.' });
});

// ─── Middleware ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: config.jsonLimit }));

// NOTA: Los archivos de media estáticos (variantes procesadas) NO se sirven
// desde Express. En producción, Nginx (o un CDN) debe servir el directorio
// directamente (ver docs/NginxConfig.md). El Engine solo genera las URLs,
// no sirve los archivos. El directorio se crea para que el worker escriba.
//
// Directorio media: {config.uploadsDir}/media/
// URL pública:     {config.mediaBaseUrl}/media/{datePath}/{id}/{variant}.{ext}

const mediaStaticDir = path.join(config.uploadsDir, 'media');
if (!fs.existsSync(mediaStaticDir)) fs.mkdirSync(mediaStaticDir, { recursive: true });

// ─── Health Check ──────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    service: 'Atlx_MediaEngine_V3',
    status: 'ok',
    version: '3.0.0',
    services: serviceRegistry.listServices().map(s => s.sourceApp),
    uptime: process.uptime(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────

app.use(mediaRoutes);
app.use(adminRoutes);

// ─── Error Handler ─────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('[Express] Error no manejado:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

// ─── Inicio ────────────────────────────────────────────────────────────────

async function start() {
  // Inicializar pool de conexión
  const { getPool } = require('./db');
  try {
    await getPool();
    console.log('[start] Conexión a BD establecida');
  } catch (err) {
    console.error('[start] Error conectando a BD:', err.message);
    process.exit(1);
  }

  // Iniciar servidor HTTP
  app.listen(config.port, () => {
    console.log(`[Atlx_MediaEngine_V3] Servidor iniciado en puerto ${config.port}`);
    console.log(`[Atlx_MediaEngine_V3] Media base URL: ${config.mediaBaseUrl}`);
    console.log(`[Atlx_MediaEngine_V3] Servicios registrados: ${serviceRegistry.listServices().map(s => s.sourceApp).join(', ')}`);

    // Iniciar worker de procesamiento background
    processingWorker.start();
  });
}

// ─── Graceful Shutdown ─────────────────────────────────────────────────────

process.on('SIGINT', async () => {
  console.log('\n[Atlx_MediaEngine_V3] Apagando...');
  processingWorker.stop();
  const { close } = require('./db');
  await close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Atlx_MediaEngine_V3] Apagando...');
  processingWorker.stop();
  const { close } = require('./db');
  await close();
  process.exit(0);
});

start();
