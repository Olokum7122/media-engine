'use strict';

/**
 * mediaRoutes.js — Endpoints REST del Media Engine V3.
 *
 * Contrato según API Contract (06_API_CONTRACT.md).
 *
 * Endpoints:
 *   POST   /api/media/requests                    — Crear media request
 *   POST   /api/media/:mediaId/rights-origin      — Registrar derechos/origen
 *   GET    /api/media/:mediaId/rights-origin       — Obtener derechos/origen
 *   POST   /api/media/:mediaId/original            — Registrar archivo original
 *   GET    /api/media/:mediaId                     — Obtener info de media
 *   GET    /api/media/:mediaId/ready-payload       — Obtener ready payload
 *   GET    /api/media/:mediaId/policy              — Evaluar política
 *   POST   /api/media/:mediaId/cancel              — Cancelar media
 */

const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config');

const requestService = require('../services/mediaEngine/requestService');
const rightsService = require('../services/mediaEngine/rightsService');
const originalService = require('../services/mediaEngine/originalService');
const payloadService = require('../services/mediaEngine/payloadService');
const policyEvaluator = require('../services/mediaEngine/policyEvaluator');

const router = Router();

// ─── Multer config para upload de archivos ──────────────────────────────────

const uploadDir = path.join(config.uploadsDir, 'temp');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;
      const ext = path.extname(file.originalname) || '';
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/media/requests — Crear media request
// ═════════════════════════════════════════════════════════════════════════════

router.post('/api/media/requests', async (req, res) => {
  try {
    const { sourceApp, sourceActorType, sourceActorId, targetContext,
            mediaType, externalContextId, externalTraceId, clientReferenceId,
            processingProfileCode, watermarkProfileCode } = req.body;

    if (!sourceApp || !sourceActorType || !sourceActorId || !targetContext || !mediaType) {
      return res.status(400).json({
        error: 'Campos requeridos: sourceApp, sourceActorType, sourceActorId, targetContext, mediaType',
      });
    }

    const result = await requestService.createRequest({
      sourceApp, sourceActorType, sourceActorId, targetContext, mediaType,
      externalContextId, externalTraceId, clientReferenceId,
      processingProfileCode, watermarkProfileCode,
    });

    res.status(201).json({
      mediaId: result.media_id,
      status: result.status,
      mediaType: result.media_type,
      createdAt: result.created_at,
    });
  } catch (err) {
    console.error('[POST /api/media/requests]', err.message);

    // Manejar error de client_reference_id duplicado
    if (err.message.includes('UQ') || err.message.includes('unique') || err.message.includes('duplicate')) {
      return res.status(409).json({ error: 'clientReferenceId duplicado para este sourceApp', detail: err.message });
    }

    res.status(500).json({ error: 'Error al crear media request', detail: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/media/:mediaId/rights-origin — Registrar derechos/origen
// ═════════════════════════════════════════════════════════════════════════════

router.post('/api/media/:mediaId/rights-origin', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const result = await rightsService.upsertRightsOrigin({
      mediaId,
      ...req.body,
    });

    res.status(200).json({
      mediaId,
      originType: result?.origin_type,
      rightsStatus: result?.rights_status,
      updatedAt: result?.updated_at,
    });
  } catch (err) {
    console.error('[POST /api/media/:mediaId/rights-origin]', err.message);
    res.status(500).json({ error: 'Error al registrar derechos/origen', detail: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/media/:mediaId/rights-origin — Obtener derechos/origen
// ═════════════════════════════════════════════════════════════════════════════

router.get('/api/media/:mediaId/rights-origin', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const result = await rightsService.getRightsOrigin(mediaId);

    if (!result) {
      return res.status(404).json({ error: 'No se encontraron derechos/origen para este media' });
    }

    res.json(result);
  } catch (err) {
    console.error('[GET /api/media/:mediaId/rights-origin]', err.message);
    res.status(500).json({ error: 'Error al obtener derechos/origen', detail: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/media/:mediaId/original — Registrar archivo original (multipart)
// ═════════════════════════════════════════════════════════════════════════════

router.post('/api/media/:mediaId/original', upload.single('file'), async (req, res) => {
  try {
    const { mediaId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Archivo requerido (campo "file")' });
    }

    const mimeType = file.mimetype;
    const extension = path.extname(file.originalname).replace('.', '') || _detectExt(mimeType);

    // Calcular SHA-256
    const sha256 = await _computeFileHash(file.path);

    // Determinar storage path final
    const datePath = _getDatePath();
    const storagePath = `/media/${datePath}/${mediaId}/original.${extension}`;
    const finalPath = path.join(config.uploadsDir, storagePath);
    const finalDir = path.dirname(finalPath);
    if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

    // Mover archivo temporal a su ubicación final
    fs.renameSync(file.path, finalPath);

    const stats = fs.statSync(finalPath);

    await originalService.registerOriginal({
      mediaId,
      originalFileName: file.originalname,
      originalUrl: `${config.mediaBaseUrl}${storagePath}`,
      originalStoragePath: finalPath,
      mimeType,
      extension,
      sizeBytes: stats.size,
      sha256Hash: sha256,
    });

    res.status(200).json({
      mediaId,
      status: 'uploaded',
      originalUrl: `${config.mediaBaseUrl}${storagePath}`,
      sizeBytes: stats.size,
      mimeType,
      sha256Hash: sha256,
    });
  } catch (err) {
    console.error('[POST /api/media/:mediaId/original]', err.message);
    res.status(500).json({ error: 'Error al registrar archivo original', detail: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/media/:mediaId — Obtener info de media (diagnóstico)
// ═════════════════════════════════════════════════════════════════════════════

router.get('/api/media/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const media = await requestService.getById(mediaId);

    if (!media) {
      return res.status(404).json({ error: 'Media no encontrado' });
    }

    res.json(media);
  } catch (err) {
    console.error('[GET /api/media/:mediaId]', err.message);
    res.status(500).json({ error: 'Error al obtener media', detail: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/media/:mediaId/ready-payload — Obtener ready payload
// ═════════════════════════════════════════════════════════════════════════════

router.get('/api/media/:mediaId/ready-payload', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const payload = await payloadService.getReadyPayload(mediaId);

    if (!payload) {
      return res.status(404).json({ error: 'Media no encontrado' });
    }

    // Respuesta según contrato: si no está ready, payload = null
    res.json(payload);
  } catch (err) {
    console.error('[GET /api/media/:mediaId/ready-payload]', err.message);
    res.status(500).json({ error: 'Error al obtener ready payload', detail: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  GET /api/media/:mediaId/policy — Evaluar política de derechos
// ═════════════════════════════════════════════════════════════════════════════

router.get('/api/media/:mediaId/policy', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const policy = await policyEvaluator.evaluate(mediaId);

    res.json(policy);
  } catch (err) {
    console.error('[GET /api/media/:mediaId/policy]', err.message);
    res.status(500).json({ error: 'Error al evaluar política', detail: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  POST /api/media/:mediaId/cancel — Cancelar media pendiente
// ═════════════════════════════════════════════════════════════════════════════

router.post('/api/media/:mediaId/cancel', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { reason } = req.body || {};
    const canceled = await requestService.cancel(mediaId, reason);

    if (!canceled) {
      return res.status(404).json({ error: 'Media no encontrado o no se pudo cancelar' });
    }

    res.json({ mediaId, status: 'canceled' });
  } catch (err) {
    console.error('[POST /api/media/:mediaId/cancel]', err.message);
    res.status(500).json({ error: 'Error al cancelar media', detail: err.message });
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function _getDatePath() {
  const d = new Date();
  return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function _detectExt(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
  };
  return map[mimeType] || 'bin';
}

function _computeFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', d => hash.update(d));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

module.exports = router;
