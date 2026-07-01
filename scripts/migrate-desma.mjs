/**
 * migrate-desma.mjs — Migra solo En el Desma (soc_posts) al Media Engine V3
 *
 * Uso: node scripts/migrate-desma.mjs
 */

import sql from 'mssql';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const config = require('../src/config');

const ENGINE_URL = 'http://localhost:4100';
const TEMP_DIR = path.resolve('./.migration-temp');

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
  const res = await fetch(`${ENGINE_URL}/api/media/${mediaId}/original`, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(`uploadOriginal: ${data.error || JSON.stringify(data)}`);
  return data;
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function waitForReady(mediaId, maxAttempts = 120) {
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) await delay(3000);
    const payload = await apiGet(`/api/media/${mediaId}/ready-payload`);
    if (payload.status === 'ready' && payload.ready && payload.payload) return payload;
    if (payload.status === 'failed' || payload.status === 'rejected')
      throw new Error(`Media ${mediaId} termino en "${payload.status}"`);
    process.stdout.write(`  [${i+1}/${maxAttempts}] ${payload.status}\n`);
  }
  throw new Error(`Timeout tras ${maxAttempts} intentos`);
}

async function main() {
  console.log('=== Migracion En el Desma → Media Engine V3 ===\n');

  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  const appConfig = { ...config.sql, database: 'ATLX_ANTOJADOS_APP' };
  const pool = await new sql.ConnectionPool(appConfig).connect();
  console.log('✅ Conectado\n');

  let ok = 0, fail = 0;

  try {
    const rows = await pool.request().query(`
      SELECT post_id AS id, COALESCE(media_feed_url, media_url) AS media_url
      FROM antojados_core.soc_posts
      WHERE feed_type = 'desma' AND media_url IS NOT NULL
      ORDER BY published_at
    `);

    for (const row of rows.recordset) {
      let mediaUrl = row.media_url;
      if (mediaUrl.startsWith('/')) mediaUrl = `http://185.187.235.253:8010${mediaUrl}`;

      const ext = path.extname(new URL(mediaUrl).pathname) || '.jpg';
      const tempFile = path.join(TEMP_DIR, `${row.id}${ext}`);

      console.log(`\n📥 ${row.id} (${ext})`);

      try {
        // Descargar
        const res = await fetch(mediaUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(tempFile, buf);
        console.log(`   ${(buf.length / 1024).toFixed(0)} KB descargados`);

        const mediaType = ext === '.mp4' ? 'video' : 'image';
        const refId = `migrate-desma-${row.id}-${Date.now()}`;

        // 1. Create request
        const req = await apiPost('/api/media/requests', {
          sourceApp: 'admin', sourceActorType: 'system', sourceActorId: 'migration-script',
          targetContext: 'post', mediaType, clientReferenceId: refId,
        });
        const mid = req.mediaId;
        console.log(`   mediaId: ${mid}`);

        // 2. Rights
        await apiPost(`/api/media/${mid}/rights-origin`, {
          originType: mediaType === 'video' ? 'external_platform' : 'created_in_antojados',
          originPlatform: 'antojados',
          ownershipType: mediaType === 'video' ? 'third_party' : 'creator_owned',
          rightsDeclaration: mediaType === 'video' ? 'i_have_permission' : 'i_am_author',
          rightsStatus: 'declared',
          licenseType: mediaType === 'video' ? 'external_unverified' : 'user_generated',
          licenseScope: 'platform_public',
          engineWatermarkPolicy: 'skip',
          isDemoContent: false,
          allowPublicDisplay: true, allowDownload: false, allowShare: true, allowEngineWatermark: false,
        });

        // 3. Upload
        await uploadFile(mid, tempFile, `desma-${row.id}${ext}`);

        // 4. Wait
        const payload = await waitForReady(mid);
        const engineUrl = payload.payload?.feedUrl || payload.payload?.thumbUrl || '';
        console.log(`   ✅ ${engineUrl.substring(0, 70)}`);

        // 5. Update DB
        await pool.request()
          .input('url', sql.NVarChar(500), engineUrl)
          .input('id', sql.NVarChar(64), row.id)
          .query(`
            UPDATE antojados_core.soc_posts
            SET media_url = @url, media_thumbnail_url = @url, media_feed_url = @url, media_full_url = @url
            WHERE post_id = @id
          `);

        ok++;
      } catch (err) {
        console.error(`   ❌ ${err.message}`);
        fail++;
      } finally {
        try { fs.unlinkSync(tempFile); } catch {}
      }
    }
  } finally {
    await pool.close();
    try { fs.rmSync(TEMP_DIR, { recursive: true }); } catch {}
  }

  console.log(`\n=== Resultado: ${ok} ok, ${fail} fail ===`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
