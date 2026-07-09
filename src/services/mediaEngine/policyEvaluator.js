'use strict';

/**
 * policyEvaluator.js — Evaluación de políticas de derechos.
 *
 * ⚠️ POLÍTICA DE WATERMARK (automática del Engine):
 *    - Si el contenido NO tiene watermark externo → aplicar watermark de AntojadosMX
 *      (bitmap.png, opacidad 0.3, posición abajo izquierda, flotante tipo fantasma)
 *    - Si el contenido SÍ tiene watermark externo (de otra red social) → NO aplicar watermark,
 *      preservar el externo, registrar en metadata origin_platform
 *    - Esto es política del Engine, no decisión del autor.
 *    - El Engine nunca rechaza contenido. TODO se procesa.
 */

const { getPool, sql } = require('../../db');

/**
 * Evalúa la política para un media.
 * 
 * @param {string} mediaId
 * @returns {Promise<object>}
 */
async function evaluate(mediaId) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('media_id', sql.UniqueIdentifier, mediaId)
      .query(`
        SELECT 
          origin_type,
          origin_platform,
          rights_status,
          engine_watermark_policy,
          allow_engine_watermark,
          is_demo_content,
          original_watermark_detected,
          original_author_handle,
          origin_url,
          watermark_profile_code
        FROM me.media_rights_origin
        WHERE media_id = @media_id
      `);

    const rights = result.recordset[0];

    // ─── Política de Watermark ───────────────────────────────────
    // Si se detectó watermark externo → NO aplicar watermark de Antojados
    // Si NO hay watermark externo → aplicar watermark de Antojados (obligatorio)
    let shouldApplyEngineWatermark = false;
    let watermarkProfileCode = null;

    if (rights) {
      if (rights.original_watermark_detected) {
        // Contenido con watermark externo (TikTok, IG, FB, etc.)
        // Preservar watermark externo, no aplicar el de Antojados
        shouldApplyEngineWatermark = false;
        watermarkProfileCode = null;
      } else {
        // Contenido original sin watermark externo
        // Aplicar watermark de AntojadosMX automáticamente
        shouldApplyEngineWatermark = true;
        watermarkProfileCode = rights.watermark_profile_code || 'antojados_default';
      }
    } else {
      // No hay derechos registrados → aplicar watermark por defecto
      shouldApplyEngineWatermark = true;
      watermarkProfileCode = 'antojados_default';
    }

    // ⚠️ Excepción: contenido demo nunca lleva watermark
    if (rights?.is_demo_content) {
      shouldApplyEngineWatermark = false;
      watermarkProfileCode = null;
    }

    return {
      mediaId,
      canProcess: true,
      canPublish: true,
      canDownload: true,
      canShare: true,
      shouldApplyEngineWatermark,
      watermarkProfileCode,
      shouldPreserveExternalWatermark: rights?.original_watermark_detected ? true : false,
      requiresAdminReview: false,
      policyReason: rights
        ? `Origen: ${rights.origin_type} (${rights.origin_platform}) — ${
            rights.original_watermark_detected
              ? 'Watermark externo detectado, se preserva'
              : 'Sin watermark externo, se aplica watermark AntojadosMX'
          }`
        : 'Sin derechos registrados — se aplica watermark AntojadosMX por defecto',
      originType: rights?.origin_type || 'unknown',
      originPlatform: rights?.origin_platform || 'unknown',
      originalAuthorHandle: rights?.original_author_handle || null,
      isDemoContent: rights?.is_demo_content || false,
    };
  } catch (err) {
    console.error('[policyEvaluator] Error:', err.message);
    return {
      mediaId,
      canProcess: true,
      canPublish: true,
      canDownload: true,
      canShare: true,
      shouldApplyEngineWatermark: true,
      watermarkProfileCode: 'antojados_default',
      shouldPreserveExternalWatermark: false,
      requiresAdminReview: false,
      policyReason: 'Error al evaluar política — fail open, se aplica watermark AntojadosMX',
      originType: 'unknown',
      originPlatform: 'unknown',
      originalAuthorHandle: null,
      isDemoContent: false,
    };
  }
}

/**
 * Determina si se debe aplicar watermark y con qué perfil.
 *
 * @param {object} rights  — registro de media_rights_origin
 * @returns {{ apply: boolean, profileCode: string|null }}
 */
function getWatermarkPolicy(rights) {
  if (!rights) {
    // Sin datos: aplicar watermark por defecto
    return { apply: true, profileCode: 'antojados_default' };
  }

  // Contenido demo: sin watermark
  if (rights.is_demo_content) {
    return { apply: false, profileCode: null };
  }

  // Watermark externo detectado: no aplicar
  if (rights.original_watermark_detected) {
    return { apply: false, profileCode: null };
  }

  // Sin watermark externo: aplicar AntojadosMX
  return {
    apply: true,
    profileCode: rights.watermark_profile_code || 'antojados_default',
  };
}

module.exports = { evaluate, getWatermarkPolicy };
