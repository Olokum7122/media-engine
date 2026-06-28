'use strict';

/**
 * db.js — Pool de conexión a SQL Server para Media Engine V3.
 *
 * Exporta:
 *   getPool()   → pool conectado a Atlx_Mediaengine (schema me)
 *   sql         → el módulo mssql (para tipos como sql.NVarChar, etc.)
 *   close()     → cierra el pool
 */

const sql = require('mssql');
const config = require('./config');

let pool = null;

/**
 * Obtiene (o crea) el pool de conexión a Atlx_Mediaengine.
 * @returns {Promise<sql.ConnectionPool>}
 */
async function getPool() {
  if (pool && pool.connected) {
    return pool;
  }
  pool = new sql.ConnectionPool(config.sql);
  await pool.connect();
  console.log('[db] Conectado a Atlx_Mediaengine en', config.sql.server);
  return pool;
}

/**
 * Cierra el pool de conexión.
 */
async function close() {
  if (pool) {
    try { await pool.close(); } catch (_) { /* ignore */ }
    pool = null;
    console.log('[db] Pool cerrado');
  }
}

module.exports = { getPool, sql, close };
