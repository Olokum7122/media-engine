'use strict';

/**
 * policyEvaluator.js — Evaluación de políticas de derechos.
 *
 * Wrapper sobre me.sp_media_rights_policy_evaluate con helpers
 * para interpretar los resultados según la especificación V3.
 */

const rightsService = require('./rightsService');

/**
 * Evalúa la política completa para un media.
 *
 * @param {string} mediaId
 * @returns {Promise<object>} Resultado de la evaluación.
 */
async function evaluate(mediaId) {
  const policy = await rightsService.evaluatePolicy(mediaId);
  if (!policy) {
    return {
      mediaId,
      canProcess: false,
      canPublish: false,
      canDownload: false,
      canShare: false,
      shouldApplyEngineWatermark: false,
      shouldPreserveExternalWatermark: false,
      requiresAdminReview: true,
      policyReason: 'No se encontraron derechos registrados',
    };
  }

  return {
    mediaId,
    canProcess: Boolean(policy.can_process),
    canPublish: Boolean(policy.can_publish),
    canDownload: Boolean(policy.can_download),
    canShare: Boolean(policy.can_share),
    shouldApplyEngineWatermark: Boolean(policy.should_apply_engine_watermark),
    shouldPreserveExternalWatermark: Boolean(policy.should_preserve_external_watermark),
    requiresAdminReview: Boolean(policy.requires_admin_review),
    policyReason: policy.policy_reason || null,
  };
}

/**
 * Determina el watermark profile code según el origen y política.
 *
 * @param {object} rights  — registro de media_rights_origin
 * @returns {string|null}  — código del profile o null si no aplica
 */
function getWatermarkProfileCode(rights) {
  if (!rights) return null;

  if (rights.engine_watermark_policy === 'preserve_external') {
    return null; // No aplicar watermark de Antojados
  }
  if (rights.engine_watermark_policy === 'blocked') {
    return null;
  }
  if (rights.engine_watermark_policy === 'admin_review') {
    return null; // Pendiente de revisión
  }
  if (rights.engine_watermark_policy === 'apply' && rights.allow_engine_watermark) {
    return 'antojados_default'; // Profile por defecto
  }
  if (rights.engine_watermark_policy === 'skip') {
    return null;
  }
  return null;
}

module.exports = { evaluate, getWatermarkProfileCode };
