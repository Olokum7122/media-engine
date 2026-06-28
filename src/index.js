'use strict';

/**
 * ATLX Media Engine V3 — Punto de entrada principal.
 *
 * Integra:
 *   - API REST (Express)
 *   - Processing Worker (background)
 *   - Sirve archivos estáticos (variantes de media)
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const mediaRoutes = require('./routes/mediaRoutes');
const processingWorker = require('./services/mediaEngine/processingWorker');

const app = express();

// ─── Middleware ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: config.jsonLimit }));

// Servir archivos de media estáticos (variantes procesadas)
const mediaStaticDir = path.join(config.uploadsDir, 'media');
if (!fs.existsSync(mediaStaticDir)) fs.mkdirSync(mediaStaticDir, { recursive: true });
app.use('/media', express.static(mediaStaticDir, {
  maxAge: '365d',
  immutable: true,
}));

// ─── Health Check ──────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    service: 'Atlx_MediaEngine_V3',
    status: 'ok',
    version: '3.0.0',
    uptime: process.uptime(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────

app.use(mediaRoutes);

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
