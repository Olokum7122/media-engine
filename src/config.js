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

  // Worker
  worker: {
    pollIntervalMs: parseInt(process.env.ME_WORKER_POLL_INTERVAL_MS || '15000', 10),
    maxBatch: parseInt(process.env.ME_WORKER_MAX_BATCH || '3', 10),
    videoTimeoutMs: parseInt(process.env.ME_WORKER_VIDEO_TIMEOUT_MS || '300000', 10),
  },

  // Worker identity (for job locking)
  workerId: process.env.ME_WORKER_ID || `worker-${require('os').hostname()}-${process.pid}`,
};

module.exports = config;
