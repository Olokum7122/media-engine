'use strict';

/**
 * profileMapper.js — Adaptador genérico de perfiles de procesamiento
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMINIO:      ATLX Media Engine — Fallback genérico
 * RESPONSABLE:  Resolver processing_profile_code para servicios no registrados
 *               o que no tienen adaptador específico
 *
 * NO HACE:
 *   - No conoce canales de Antojados ni Explorer
 *   - No aplica reglas de negocio específicas de ningún servicio
 *   - Solo devuelve 'standard' (compatibilidad universal)
 *
 * USO:
 *   Se registra automáticamente como servicio 'generic' en serviceRegistry.
 *   Cualquier sourceApp no registrado usará este mapper.
 *
 * REFERENCIAS:
 *   - serviceRegistry.js → registro del servicio 'generic'
 *   - processingWorker.js → fallback si no hay mapper específico
 * ══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Siempre devuelve 'standard' para servicios no registrados.
 *
 * @param {object} _input - Ignorado (compatibilidad de interfaz)
 * @returns {string} - Siempre 'standard'
 */
function resolveProfile(_input = {}) {
  return 'standard';
}

/**
 * Perfiles disponibles para servicios genéricos.
 *
 * @returns {string[]}
 */
function getAvailableProfiles() {
  return ['standard'];
}

module.exports = {
  resolveProfile,
  getAvailableProfiles,
};
