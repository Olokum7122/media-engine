/**
 * run-migration.mjs — Migra datos legacy de antojados_core al Media Engine V3
 *
 * Uso: node scripts/run-migration.mjs
 *
 * Requiere el Media Engine V3 corriendo en localhost:4100
 * y conexion a SQL Server configurada en .env del engine.
 *
 * Migra:
 *   - Arre (biz_posts channel='arre') — 10 registros
 *   - Vas Ir (biz_posts channel='vas_ir') — registros unicos
 *   - En el Desma (soc_posts feed_type='desma') — 40 registros
 */

import sql from 'mssql';
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const config = require('../src/config');

// ─── Config ──────────────────────────────────────────────────────────────────

const ENGINE_URL = 'http://localhost:4100';
const TEMP_DIR = path.resolve('./.migration-temp');

// ─── HTTP helper para Media Engine ──────────────────────────────────────────

function engineRequest(method, endpoint, body = null, isMultipart = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, ENGINE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {},
    };

    if (!isMultipart && body) {
      const data = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (isMultipart && body) {
      // Para multipart, body ya es un Buffer (FormData)
      req.write(body);
    } else if (body && !isMultipart) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

function buildMultipart(mediaId, filePath, fileName) {
  const boundary = '----MigrationBoundary' + Date.now();
  const fileContent = fs.readFileSync(filePath);
  const header = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: application/octet-stream\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([header, fileContent, footer]);

  return {
    body,
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Media Engine API ────────────────────────────────────────────────────────

async function createMediaRequest(input) {
  const res = await engineRequest('POST', '/api/media/requests', input);
  if (res.status >= 400) throw new Error(`createMediaRequest: ${res.data?.error || res.status}`);
  return res.data;
}

async function registerRightsOrigin(mediaId, input) {
  const res = await engineRequest('POST', `/api/media/${mediaId}/rights-origin`, input);
  if (res.status >= 400) throw new Error(`registerRightsOrigin: ${res.data?.error || res.status}`);
  return res.data;
}

async function uploadOriginal(mediaId, filePath, fileName) {
  const { body, headers } = buildMultipart(mediaId, filePath, fileName);
  const res = await new Promise((resolve, reject) => {
    const url = new URL(`/api/media/${mediaId}/original`, ENGINE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers,
    };
    const req = http.request(options, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        try { resolve({ status: r.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: r.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
  if (res.status >= 400) throw new Error(`uploadOriginal: ${res.data?.error || res.status}`);
  return res.data;
}

async function waitForReady(mediaId, maxAttempts = 80) {
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) await delay(3000);
    const res = await engineRequest('GET', `/api/media/${mediaId}/ready-payload`);
    if (res.status >= 400) throw new Error(`getReadyPayload: ${res.data?.error || res.status}`);
    const p = res.data;
    if (p.status === 'ready' && p.ready && p.payload) return p;
    if (p.status === 'failed' || p.status === 'rejected') throw new Error(`Media ${mediaId} termino en estado "${p.status}"`);
    process.stdout.write(`  [${mediaId}] intento ${i + 1}/${maxAttempts}: ${p.status}\n`);
  }
  throw new Error(`Media ${mediaId} no se completo tras ${maxAttempts} intentos`);
}

// ─── Download helper ─────────────────────────────────────────────────────────

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    http.get(url, (response) => {
      if (response.statusCode >= 400) {
        reject(new Error(`HTTP ${response.statusCode} al descargar ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// ─── Migrar un registro ──────────────────────────────────────────────────────

async function migrateOne(id, mediaUrl, source, channel) {
  if (!mediaUrl || mediaUrl === '(null)') {
    console.log(`  ⏭️  ${id}: sin media_url, saltando`);
    return null;
  }

  // Resolver URL completa
  let fullUrl = mediaUrl;
  if (fullUrl.startsWith('/')) {
    fullUrl = `http://185.187.235.253:8010${fullUrl}`;
  }

  console.log(`  📥 Descargando ${fullUrl}...`);
  const ext = path.extname(new URL(fullUrl).pathname) || '.jpg';
  const tempFile = path.join(TEMP_DIR, `${id}${ext}`);

  try {
    await downloadFile(fullUrl, tempFile);
    const stats = fs.statSync(tempFile);
    console.log(`    Descargado: ${(stats.size / 1024).toFixed(1)} KB`);

    const mimeType = ext === '.mp4' ? 'video/mp4' : `image/${ext.replace('.', '')}`;
    const mediaType = mimeType.startsWith('video') ? 'video' : 'image';

    // 1. Create media request
    const request = await createMediaRequest({
      sourceApp: 'admin',
      sourceActorType: 'system',
      sourceActorId: 'migration-script',
      targetContext: source === 'biz_posts' ? 'post' : 'post',
      mediaType,
      clientReferenceId: `migrate-${source}-${id}-${Date.now()}`,
    });
    const mediaId = request.mediaId;
    console.log(`    Media request creado: ${mediaId}`);

    // 2. Register rights
    await registerRightsOrigin(mediaId, {
      originType: 'created_in_antojados',
      originPlatform: 'antojados',
      ownershipType: 'creator_owned',
      rightsDeclaration: 'i_am_author',
      rightsStatus: 'declared',
      licenseType: 'user_generated',
      licenseScope: 'platform_public',
      engineWatermarkPolicy: 'skip',
      isDemoContent: false,
      allowPublicDisplay: true,
      allowDownload: false,
      allowShare: true,
      allowEngineWatermark: false,
    });

    // 3. Upload original
    await uploadOriginal(mediaId, tempFile, `migrated-${id}${ext}`);

    // 4. Wait for ready
    const payload = await waitForReady(mediaId);
    const engineUrl = payload.payload?.feedUrl || payload.payload?.thumbUrl || '';
    console.log(`    ✅ ${id} → ${engineUrl.substring(0, 80)}`);

    return { mediaId, engineUrl, mediaType };

  } catch (err) {
    console.error(`    ❌ ${id}: ${err.message}`);
    return null;
  } finally {
    // Limpiar temp
    try { fs.unlinkSync(tempFile); } catch {}
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Migracion Legacy → Media Engine V3 ===\n');

  // Crear temp dir
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  // Conectar a BD
  const appConfig = { ...config.sql, database: 'ATLX_ANTOJADOS_APP' };
  console.log(`Conectando a BD (${config.sql.server})...`);
  const pool = await new sql.ConnectionPool(appConfig).connect();
  console.log('✅ Conectado\n');

  const results = { success: 0, failed: 0, skipped: 0 };

  try {
    // ─── 1. Arre ──────────────────────────────────────────────────────────
    console.log('=== Arre (biz_posts) ===');
    const arrePosts = await pool.request().query(`
      SELECT DISTINCT bp.biz_post_id AS id, COALESCE(bpm.feed_url, bp.media_url) AS media_url, bp.channel
      FROM antojados_core.biz_posts bp
      LEFT JOIN antojados_core.biz_post_media bpm ON bpm.post_id = bp.biz_post_id
      WHERE bp.channel = 'arre' AND (bpm.feed_url IS NOT NULL OR bp.media_url IS NOT NULL)
    `);
    for (const row of arrePosts.recordset) {
      const result = await migrateOne(row.id, row.media_url, 'biz_posts', 'arre');
      if (result) {
        // Actualizar el post con el nuevo mediaId
        await pool.request()
          .input('mediaId', sql.NVarChar(64), result.mediaId)
          .input('engineUrl', sql.NVarChar(500), result.engineUrl)
          .input('postId', sql.NVarChar(64), row.id)
          .query(`
            UPDATE antojados_core.biz_posts
            SET media_url = @engineUrl,
                media_engine_id = @mediaId
            WHERE biz_post_id = @postId
          `);
        results.success++;
      } else {
        results.failed++;
      }
    }

    // ─── 2. Vas Ir (solo posts unicos, no duplicados de batch) ──────────
    console.log('\n=== Vas Ir (biz_posts) ===');
    const vasIrPosts = await pool.request().query(`
      SELECT DISTINCT bp.biz_post_id AS id, COALESCE(bpm.feed_url, bp.media_url) AS media_url, bp.channel
      FROM antojados_core.biz_posts bp
      LEFT JOIN antojados_core.biz_post_media bpm ON bpm.post_id = bp.biz_post_id
      WHERE bp.channel = 'vas_ir' AND (bpm.feed_url IS NOT NULL OR bp.media_url IS NOT NULL)
    `);
    for (const row of vasIrPosts.recordset) {
      const result = await migrateOne(row.id, row.media_url, 'biz_posts', 'vas_ir');
      if (result) {
        await pool.request()
          .input('mediaId', sql.NVarChar(64), result.mediaId)
          .input('engineUrl', sql.NVarChar(500), result.engineUrl)
          .input('postId', sql.NVarChar(64), row.id)
          .query(`
            UPDATE antojados_core.biz_posts
            SET media_url = @engineUrl,
                media_engine_id = @mediaId
            WHERE biz_post_id = @postId
          `);
        results.success++;
      } else {
        results.failed++;
      }
    }

    // ─── 3. En el Desma ─────────────────────────────────────────────────
    console.log('\n=== En el Desma (soc_posts) ===');
    const desmaPosts = await pool.request().query(`
      SELECT post_id AS id, media_url, media_thumbnail_url, media_feed_url, media_full_url
      FROM antojados_core.soc_posts
      WHERE feed_type = 'desma' AND media_url IS NOT NULL
      ORDER BY published_at
    `);
    for (const row of desmaPosts.recordset) {
      const mediaUrl = row.media_feed_url || row.media_url;
      const result = await migrateOne(row.id, mediaUrl, 'soc_posts', 'desma');
      if (result) {
        await pool.request()
          .input('mediaId', sql.NVarChar(64), result.mediaId)
          .input('engineUrl', sql.NVarChar(500), result.engineUrl)
          .input('postId', sql.NVarChar(64), row.id)
          .query(`
            UPDATE antojados_core.soc_posts
            SET media_url = @engineUrl,
                media_thumbnail_url = @engineUrl,
                media_feed_url = @engineUrl,
                media_full_url = @engineUrl,
                media_engine_id = @mediaId
            WHERE post_id = @postId
          `);
        results.success++;
      } else {
        results.failed++;
      }
    }

    console.log('\n=== Resultados finales ===');
    console.log(`  ✅ Migrados: ${results.success}`);
    console.log(`  ❌ Fallidos: ${results.failed}`);
    console.log(`  ⏭️  Saltados: ${results.skipped}`);

  } finally {
    await pool.close();
    // Limpiar temp
    try { fs.rmSync(TEMP_DIR, { recursive: true }); } catch {}
  }
}

main().catch(err => {
  console.error('\nERROR FATAL:', err.message);
  process.exit(1);
});
