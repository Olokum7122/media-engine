/**
 * migration-runner.mjs — Migra datos legacy de antojados_core al Media Engine V3
 *
 * Uso: node scripts/migration-runner.mjs
 *
 * Requisitos:
 *   - Media Engine V3 corriendo en localhost:4100
 *   - Node.js 18+ (para fetch y FormData nativos)
 *   - Conexion a SQL Server configurada en .env del engine
 */

import sql from 'mssql';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const require = createRequire(import.meta.url);
const config = require('../src/config');

const ENGINE_URL = 'http://localhost:4100';
const TEMP_DIR = path.resolve('./.migration-temp');

// ─── Helpers HTTP con fetch nativo ──────────────────────────────────────────

async function apiPost(endpoint, body) {
  const res = await fetch(`${ENGINE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${endpoint}: ${data.error || data.detail || JSON.stringify(data)}`);
  return data;
}

async function apiGet(endpoint) {
  const res = await fetch(`${ENGINE_URL}${endpoint}`);
  const data = await res.json();
  if (!res.ok) throw new Error(`${endpoint}: ${data.error || JSON.stringify(data)}`);
  return data;
}

async function uploadFile(mediaId, filePath, fileName) {
  const form = new FormData();
  const blob = new Blob([fs.readFileSync(filePath)], { type: 'application/octet-stream' });
  form.set('file', blob, fileName);
  
  const res = await fetch(`${ENGINE_URL}/api/media/${mediaId}/original`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`uploadOriginal: ${data.error || JSON.stringify(data)}`);
  return data;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForReady(mediaId, maxAttempts = 80) {
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) await delay(3000);
    const payload = await apiGet(`/api/media/${mediaId}/ready-payload`);
    if (payload.status === 'ready' && payload.ready && payload.payload) return payload;
    if (payload.status === 'failed' || payload.status === 'rejected') {
      throw new Error(`Media ${mediaId} termino en estado "${payload.status}"`);
    }
    process.stdout.write(`  [${mediaId}] intento ${i + 1}/${maxAttempts}: ${payload.status}\n`);
  }
  throw new Error(`Media ${mediaId} no se completo tras ${maxAttempts} intentos`);
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

// ─── Migrar un registro ─────────────────────────────────────────────────────

async function migrateOne(id, mediaUrl, source, channel, pool) {
  if (!mediaUrl || mediaUrl === '(null)') {
    console.log(`  ⏭️  ${id}: sin media_url`);
    return null;
  }

  let fullUrl = mediaUrl;
  if (fullUrl.startsWith('/')) fullUrl = `http://185.187.235.253:8010${fullUrl}`;

  const urlObj = new URL(fullUrl);
  const ext = path.extname(urlObj.pathname) || '.jpg';
  const tempFile = path.join(TEMP_DIR, `${id}${ext}`);

  console.log(`  📥 Descargando...`);
  try {
    await downloadFile(fullUrl, tempFile);
    const stats = fs.statSync(tempFile);
    console.log(`    ${(stats.size / 1024).toFixed(0)} KB`);

    const mimeType = ext === '.mp4' ? 'video/mp4' : `image/${ext.replace('.', '')}`;
    const mediaType = mimeType.startsWith('video') ? 'video' : 'image';
    const refId = `migrate-${source}-${id}-${Date.now()}`;

    // 1. Create media request
    const request = await apiPost('/api/media/requests', {
      sourceApp: 'admin',
      sourceActorType: 'system',
      sourceActorId: 'migration-script',
      targetContext: 'post',
      mediaType,
      clientReferenceId: refId,
    });
    const mediaId = request.mediaId;
    console.log(`    request: ${mediaId}`);

    // 2. Register rights
    await apiPost(`/api/media/${mediaId}/rights-origin`, {
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
    const uploadResult = await uploadFile(mediaId, tempFile, `migrated-${id}${ext}`);
    console.log(`    uploaded: ${uploadResult.status}`);

    // 4. Wait for ready
    const payload = await waitForReady(mediaId);
    const engineUrl = payload.payload?.feedUrl || payload.payload?.thumbUrl || '';
    console.log(`    ✅ ${engineUrl.substring(0, 80)}`);

    // Actualizar BD
    if (source === 'soc_posts') {
      await pool.request()
        .input('mediaId', sql.NVarChar(64), mediaId)
        .input('engineUrl', sql.NVarChar(500), engineUrl)
        .input('postId', sql.NVarChar(64), id)
        .query(`
          UPDATE antojados_core.soc_posts
          SET media_url = @engineUrl,
              media_thumbnail_url = @engineUrl,
              media_feed_url = @engineUrl,
              media_full_url = @engineUrl
          WHERE post_id = @postId
        `);
    } else {
      await pool.request()
        .input('mediaId', sql.NVarChar(64), mediaId)
        .input('engineUrl', sql.NVarChar(500), engineUrl)
        .input('postId', sql.NVarChar(64), id)
        .query(`
          UPDATE antojados_core.biz_posts
          SET media_url = @engineUrl
          WHERE biz_post_id = @postId
        `);
    }

    return mediaId;

  } catch (err) {
    console.error(`    ❌ ${err.message}`);
    return null;
  } finally {
    try { fs.unlinkSync(tempFile); } catch {}
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Migracion Legacy → Media Engine V3 ===\n');

  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  const appConfig = { ...config.sql, database: 'ATLX_ANTOJADOS_APP' };
  console.log(`Conectando a BD (${config.sql.server})...`);
  const pool = await new sql.ConnectionPool(appConfig).connect();
  console.log('✅ Conectado\n');

  const results = { success: 0, failed: 0 };

  try {
    // ─── Arre ────────────────────────────────────────────────────────────
    console.log('=== Arre (biz_posts) ===');
    const arre = await pool.request().query(`
      SELECT DISTINCT bp.biz_post_id AS id, COALESCE(bpm.feed_url, bp.media_url) AS media_url
      FROM antojados_core.biz_posts bp
      LEFT JOIN antojados_core.biz_post_media bpm ON bpm.post_id = bp.biz_post_id
      WHERE bp.channel = 'arre' AND (bpm.feed_url IS NOT NULL OR bp.media_url IS NOT NULL)
    `);
    for (const row of arre.recordset) {
      const ok = await migrateOne(row.id, row.media_url, 'biz_posts', 'arre', pool);
      ok ? results.success++ : results.failed++;
    }

    // ─── Vas Ir ──────────────────────────────────────────────────────────
    console.log('\n=== Vas Ir (biz_posts) ===');
    const vasIr = await pool.request().query(`
      SELECT DISTINCT bp.biz_post_id AS id, COALESCE(bpm.feed_url, bp.media_url) AS media_url
      FROM antojados_core.biz_posts bp
      LEFT JOIN antojados_core.biz_post_media bpm ON bpm.post_id = bp.biz_post_id
      WHERE bp.channel = 'vas_ir' AND (bpm.feed_url IS NOT NULL OR bp.media_url IS NOT NULL)
    `);
    for (const row of vasIr.recordset) {
      const ok = await migrateOne(row.id, row.media_url, 'biz_posts', 'vas_ir', pool);
      ok ? results.success++ : results.failed++;
    }

    // ─── En el Desma ─────────────────────────────────────────────────────
    console.log('\n=== En el Desma (soc_posts) ===');
    const desma = await pool.request().query(`
      SELECT post_id AS id, COALESCE(media_feed_url, media_url) AS media_url
      FROM antojados_core.soc_posts
      WHERE feed_type = 'desma' AND media_url IS NOT NULL
      ORDER BY published_at
    `);
    for (const row of desma.recordset) {
      const ok = await migrateOne(row.id, row.media_url, 'soc_posts', 'desma', pool);
      ok ? results.success++ : results.failed++;
    }

    console.log('\n=== Resultados ===');
    console.log(`  ✅ Migrados: ${results.success}`);
    console.log(`  ❌ Fallidos: ${results.failed}`);

  } finally {
    await pool.close();
    try { fs.rmSync(TEMP_DIR, { recursive: true }); } catch {}
  }
}

main().catch(err => {
  console.error('\nERROR FATAL:', err.message);
  process.exit(1);
});
