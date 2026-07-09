'use strict';

/**
 * channelProfileMapper.js — Mapeo canal → processing_profile_code
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMINIO:      AntojadosMX — Adaptador entre Media Engine y canales de Antojados
 * RESPONSABLE:  Resolver el processing_profile_code según canal, tipo de media
 *               y orientación del contenido
 *
 * NO HACE:
 *   - No procesa media (lo hace mediaProcessorV3)
 *   - No valida derechos (lo hace policyEvaluator)
 *   - No conoce de posts ni interacciones (dominio del Gateway)
 *   - No sabe de formatos de archivo ni dimensiones exactas (lo sabe mediaProcessor)
 *
 * MAPEO CANAL → PERFIL:
 *   Canal + mediaType + orientation → processingProfileCode
 *
 *   vas_ir (biz)  + image/video + any       → portrait/landscape/square según orientación
 *   arre (biz)    + image/video + any       → portrait/landscape/square según orientación
 *   barrio (soc)  + image/video + any       → portrait/landscape/square según orientación
 *   pachanga/neta + image/video + any       → portrait/landscape/square según orientación
 *   que_pex (soc) + image/video + portrait  → portrait_standard
 *   que_pex (soc) + image/video + any       → portrait/landscape/square según orientación
 *   que_pex (soc) + video + any (short)     → short_vertical
 *   desma (soc)   + video    + any          → short_vertical (solo shorts)
 *   default       + image    + any          → standard (compatibilidad)
 *
 * REFERENCIAS:
 *   - apps-antojados/docs/feed.md (Sección 9.2: Mapeo canal → perfil)
 *   - processingWorker.js → llama a resolveProfile()
 *   - mediaProcessorV3.js → usa profileCode para dimensiones de variantes
 * ══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Orientación por defecto según target_context y mediaType.
 */
const CONTEXT_DEFAULT_ORIENTATION = {
  'short': 'portrait',
  'story': 'portrait',
  'profile': 'square',
  'avatar': 'square',
  'cover': 'landscape',
};

/**
 * Canales que solo aceptan shorts verticales (desma).
 */
const SHORT_ONLY_CHANNELS = new Set(['desma']);

/**
 * Canales que soportan shorts además de contenido normal (que_pex).
 */
const SHORT_AND_STANDARD_CHANNELS = new Set(['que_pex']);

/**
 * Resuelve el processing_profile_code según canal, tipo de media y orientación.
 *
 * @param {object} input
 * @param {string} [input.channel]          - Canal de publicación (vas_ir, arre, desma, etc.)
 * @param {string} [input.mediaType]        - 'image' | 'video'
 * @param {string} [input.orientation]      - 'portrait' | 'landscape' | 'square' | null
 * @param {string} [input.targetContext]    - 'post' | 'short' | 'profile' | etc.
 * @returns {string} processing_profile_code
 */
function resolveProfile({ channel, mediaType, orientation, targetContext } = {}) {
  const ctx = (targetContext || '').toLowerCase();
  const ch = (channel || '').toLowerCase();
  const type = (mediaType || 'image').toLowerCase();
  const orient = orientation || CONTEXT_DEFAULT_ORIENTATION[ctx] || null;

  // ─── Regla especial: desma solo shorts verticales ─────────────
  if (SHORT_ONLY_CHANNELS.has(ch)) {
    return 'short_vertical';
  }

  // ─── Regla especial: target_context = 'short' ─────────────────
  if (ctx === 'short') {
    return 'short_vertical';
  }

  // ─── que_pex puede tener shorts o contenido normal ────────────
  if (SHORT_AND_STANDARD_CHANNELS.has(ch)) {
    // Si es video y no hay orientación definida → short_vertical
    if (type === 'video' && !orient) {
      return 'short_vertical';
    }
  }

  // ─── Resolución por orientación ───────────────────────────────
  if (orient === 'portrait') return 'portrait_standard';
  if (orient === 'landscape') return 'landscape_standard';
  if (orient === 'square') return 'square_standard';

  // ─── Fallback: si no hay orientación, usar standard ───────────
  return 'standard';
}

/**
 * Devuelve la lista de perfiles posibles para un canal.
 * Útil para validación y documentación.
 *
 * @param {string} channel
 * @returns {string[]}
 */
function getAvailableProfiles(channel) {
  const ch = (channel || '').toLowerCase();
  if (SHORT_ONLY_CHANNELS.has(ch)) {
    return ['short_vertical'];
  }
  if (SHORT_AND_STANDARD_CHANNELS.has(ch)) {
    return ['portrait_standard', 'landscape_standard', 'square_standard', 'short_vertical'];
  }
  return ['portrait_standard', 'landscape_standard', 'square_standard'];
}

module.exports = {
  resolveProfile,
  getAvailableProfiles,
  SHORT_ONLY_CHANNELS,
  SHORT_AND_STANDARD_CHANNELS,
};
