'use strict';

/**
 * originalService.js — Registro del archivo original.
 *
 * SP utilizado:
 *   me.sp_media_original_register
 */

const { getPool, sql } = require('../../db');

/**
 * Registra el archivo original subido para un media.
 *
 * @param {object} params
 * @param {string} params.mediaId
 * @param {string} [params.originalFileName]
 * @param {string} params.originalUrl              — URL pública del original (temporal)
 * @param {string} params.originalStoragePath      — ruta local/absoluta del archivo
 * @param {string} params.mimeType
 * @param {string} [params.extension]
 * @param {number} [params.sizeBytes]
 * @param {number} [params.width]
 * @param {number} [params.height]
 * @param {number} [params.durationMs]
 * @param {string} [params.orientation]
 * @param {string} [params.sha256Hash]
 * @param {object} [params.exifJson]
 * @param {object} [params.metadataJson]
 */
async function registerOriginal(params) {
  const pool = await getPool();
  const result = await pool.request()
    .input('media_id', sql.UniqueIdentifier, params.mediaId)
    .input('original_file_name', sql.NVarChar(260), params.originalFileName || null)
    .input('original_url', sql.NVarChar(1200), params.originalUrl || null)
    .input('original_storage_path', sql.NVarChar(1200), params.originalStoragePath || null)
    .input('mime_type', sql.NVarChar(120), params.mimeType)
    .input('extension', sql.NVarChar(20), params.extension || null)
    .input('size_bytes', sql.BigInt, params.sizeBytes || 0)
    .input('width', sql.Int, params.width || null)
    .input('height', sql.Int, params.height || null)
    .input('duration_ms', sql.Int, params.durationMs || null)
    .input('orientation', sql.NVarChar(30), params.orientation || null)
    .input('sha256_hash', sql.Char(64), params.sha256Hash || null)
    .input('exif_json', sql.NVarChar(sql.MAX), params.exifJson ? JSON.stringify(params.exifJson) : null)
    .input('metadata_json', sql.NVarChar(sql.MAX), params.metadataJson ? JSON.stringify(params.metadataJson) : null)
    .execute('me.sp_media_original_register');

  return result.recordset[0] || null;
}

module.exports = { registerOriginal };
