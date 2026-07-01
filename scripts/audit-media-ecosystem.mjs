/**
 * audit-media-ecosystem.mjs — Auditoría Forense del Ecosistema de Media
 *
 * Recorre cada punto de integración entre el Engine V3 y los componentes
 * que consumen media en Antojados. Detecta:
 *   - URLs huérfanas (referencian legacy pero no engine)
 *   - Desajustes entre tablas (engine vs destino)
 *   - Variantes faltantes en disco (thumb, feed, full no existen)
 *   - Duplicados potenciales
 *   - Discrepancias de formato S1/S2/S3
 *
 * Uso: node scripts/audit-media-ecosystem.mjs
 */

import sql from 'mssql';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const config = require('../src/config');

const ENGINE_BASE = 'http://localhost:4100';
const ENGINE_HOST = 'localhost:4100';

// ─── Helpers ────────────────────────────────────────────────────────────────

function variantUrl(storagePath, variantCode) {
  if (!storagePath) return null;
  const dir = path.dirname(storagePath);
  const ext = path.extname(storagePath);
  return `${ENGINE_BASE}/media/${path.basename(dir)}/${variantCode}${ext}`;
}

// ─── Auditoría ──────────────────────────────────────────────────────────────

const report = {
  engine: { requests: 0, ready: 0, failed: 0, processing: 0, queued: 0 },
  originals: 0,
  variants: { total: 0, byCode: {} },
  channels: {},
  discrepancies: [],
  legacyOrphans: [],
  missingFiles: [],
  summary: {},
};

async function auditEngine(pool) {
  console.log('\n🔍 1. ENGINE V3 — me schema');
  
  // Requests
  const reqs = await pool.request().query(`
    SELECT status, COUNT(*) AS c
    FROM me.media_request
    GROUP BY status
    ORDER BY status
  `);
  reqs.recordset.forEach(r => {
    report.engine[r.status] = r.c;
    report.engine.requests += r.c;
  });
  console.log(`   Requests: ${report.engine.ready} ready, ${report.engine.failed} failed, ${report.engine.processing} processing`);

  // Originals
  const ori = await pool.request().query('SELECT COUNT(*) AS c FROM me.media_original');
  report.originals = ori.recordset[0].c;
  console.log(`   Originals: ${report.originals}`);

  // Variants
  const vars = await pool.request().query(`
    SELECT variant_code, COUNT(*) AS c
    FROM me.media_variant
    GROUP BY variant_code
    ORDER BY variant_code
  `);
  vars.recordset.forEach(v => {
    report.variants.total += v.c;
    report.variants.byCode[v.variant_code] = v.c;
  });
  console.log(`   Variants: ${report.variants.total} (${Object.entries(report.variants.byCode).map(([k,v]) => `${k}:${v}`).join(', ')})`);

  // Verificar storage_paths en disco
  const storageRows = await pool.request().query(`
    SELECT TOP 100 storage_path
    FROM me.media_variant
    WHERE storage_path IS NOT NULL
  `);
  let missingOnDisk = 0;
  for (const row of storageRows.recordset) {
    const absPath = path.join(config.uploadsDir, row.storage_path);
    if (!fs.existsSync(absPath)) {
      missingOnDisk++;
      if (report.missingFiles.length < 10) {
        report.missingFiles.push(row.storage_path);
      }
    }
  }
  if (missingOnDisk > 0) {
    report.discrepancies.push(`⚠️  ${missingOnDisk} variantes no encontradas en disco (de ${storageRows.recordset.length} inspeccionadas)`);
  }
  console.log(`   Disco: ${missingOnDisk} faltantes de ${storageRows.recordset.length} check`);
}

async function auditBizPosts(appPool) {
  console.log('\n🔍 2. biz_posts — Posts de negocio (Arre/Vas Ir)');
  
  const stats = await appPool.request().query(`
    SELECT 
      channel,
      COUNT(*) AS total,
      SUM(CASE WHEN media_url LIKE '%${ENGINE_HOST}%' THEN 1 ELSE 0 END) AS engine,
      SUM(CASE WHEN media_url IS NOT NULL AND media_url NOT LIKE '%${ENGINE_HOST}%' THEN 1 ELSE 0 END) AS legacy,
      SUM(CASE WHEN media_url IS NULL OR media_url = '' THEN 1 ELSE 0 END) AS nulls
    FROM antojados_core.biz_posts
    WHERE channel IN ('arre', 'vas_ir')
    GROUP BY channel
  `);
  stats.recordset.forEach(r => {
    const key = `biz_posts[${r.channel}]`;
    report.channels[key] = r;
    console.log(`   ${r.channel}: ${r.total} total, ${r.engine} engine, ${r.legacy} legacy, ${r.nulls} null/empty`);
    if (r.legacy > 0) {
      report.legacyOrphans.push(`${key}: ${r.legacy} URLs legacy`);
    }
  });
}

async function auditBizPostMedia(appPool) {
  console.log('\n🔍 3. biz_post_media — Media de posts de negocio');
  
  const stats = await appPool.request().query(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN media_url LIKE '%${ENGINE_HOST}%' THEN 1 ELSE 0 END) AS engine,
      SUM(CASE WHEN media_url IS NOT NULL AND media_url NOT LIKE '%${ENGINE_HOST}%' THEN 1 ELSE 0 END) AS legacy,
      SUM(CASE WHEN media_url IS NULL OR media_url = '' THEN 1 ELSE 0 END) AS nulls
    FROM antojados_core.biz_post_media
  `);
  const r = stats.recordset[0];
  report.channels['biz_post_media'] = r;
  console.log(`   ${r.total} total, ${r.engine} engine, ${r.legacy} legacy, ${r.nulls} null`);
  if (r.legacy > 0) report.legacyOrphans.push(`biz_post_media: ${r.legacy} URLs legacy`);

  // Verificar consistencia con biz_posts
  const mismatch = await appPool.request().query(`
    SELECT COUNT(*) AS c
    FROM antojados_core.biz_post_media bpm
    INNER JOIN antojados_core.biz_posts bp ON bp.biz_post_id = bpm.post_id
    WHERE bp.media_url LIKE '%${ENGINE_HOST}%'
      AND bpm.media_url NOT LIKE '%${ENGINE_HOST}%'
  `);
  if (mismatch.recordset[0].c > 0) {
    report.discrepancies.push(`⚠️  ${mismatch.recordset[0].c} biz_post_media NO sincronizados con biz_posts (engine vs legacy)`);
    console.log(`   ⚠️  ${mismatch.recordset[0].c} entries NO sincronizados con biz_posts`);
  }
}

async function auditSocPosts(appPool) {
  console.log('\n🔍 4. soc_posts — Posts sociales (En el Desma)');
  
  const stats = await appPool.request().query(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN media_url LIKE '%${ENGINE_HOST}%' THEN 1 ELSE 0 END) AS engine,
      SUM(CASE WHEN media_url IS NOT NULL AND media_url NOT LIKE '%${ENGINE_HOST}%' AND media_url != '' THEN 1 ELSE 0 END) AS legacy,
      SUM(CASE WHEN media_url IS NULL OR media_url = '' THEN 1 ELSE 0 END) AS nulls
    FROM antojados_core.soc_posts
    WHERE feed_type = 'desma'
  `);
  const r = stats.recordset[0];
  report.channels['soc_posts[desma]'] = r;
  console.log(`   desma: ${r.total} total, ${r.engine} engine, ${r.legacy} legacy, ${r.nulls} null/empty`);
  if (r.legacy > 0) report.legacyOrphans.push(`soc_posts[desma]: ${r.legacy} URLs legacy`);
  if (r.nulls > 0) report.discrepancies.push(`⚠️  ${r.nulls} soc_posts[desma] sin media_url`);

  // Verificar consistencia con engine
  const mismatched = await appPool.request().query(`
    SELECT COUNT(*) AS c
    FROM antojados_core.soc_posts sp
    INNER JOIN Atlx_Mediaengine.me.media_request mr 
      ON mr.client_reference_id LIKE 'migrate-desma-' + sp.post_id + '%'
    WHERE mr.status = 'ready'
      AND (sp.media_url IS NULL OR sp.media_url NOT LIKE '%${ENGINE_HOST}%')
  `);
  if (mismatched.recordset[0].c > 0) {
    report.discrepancies.push(`🔴 ${mismatched.recordset[0].c} soc_posts READY en engine pero NO actualizados en BD`);
    console.log(`   🔴 ${mismatched.recordset[0].c} posts ready en engine pero BD no actualizada`);
  }
}

async function auditFeedBizItems(appPool) {
  console.log('\n🔍 5. feed_biz_items — Caché del feed de negocios');
  
  const stats = await appPool.request().query(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN media_url LIKE '%${ENGINE_HOST}%' THEN 1 ELSE 0 END) AS engine,
      SUM(CASE WHEN media_url IS NOT NULL AND media_url NOT LIKE '%${ENGINE_HOST}%' AND media_url != '' THEN 1 ELSE 0 END) AS legacy,
      SUM(CASE WHEN media_url IS NULL OR media_url = '' THEN 1 ELSE 0 END) AS nulls
    FROM antojados_feed.feed_biz_items
  `);
  const r = stats.recordset[0];
  report.channels['feed_biz_items'] = r;
  console.log(`   ${r.total} total, ${r.engine} engine, ${r.legacy} legacy, ${r.nulls} null`);
  if (r.legacy > 0) report.legacyOrphans.push(`feed_biz_items: ${r.legacy} URLs legacy (seeds demo)`);
  
  // Verificar consistencia con biz_posts
  const mismatch = await appPool.request().query(`
    SELECT COUNT(*) AS c
    FROM antojados_feed.feed_biz_items f
    INNER JOIN antojados_core.biz_posts bp ON bp.biz_post_id = f.biz_post_id
    WHERE bp.media_url LIKE '%${ENGINE_HOST}%'
      AND (f.media_url IS NULL OR f.media_url NOT LIKE '%${ENGINE_HOST}%')
  `);
  if (mismatch.recordset[0].c > 0) {
    report.discrepancies.push(`⚠️  ${mismatch.recordset[0].c} feed_biz_items desactualizados vs biz_posts (engine)`);
    console.log(`   ⚠️  ${mismatch.recordset[0].c} entries desactualizados vs biz_posts`);
  }
}

async function auditSocMediaAssets(appPool) {
  console.log('\n🔍 6. soc_media_assets — Assets de media procesados');
  
  const stats = await appPool.request().query(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN remote_url LIKE '%${ENGINE_HOST}%' THEN 1 ELSE 0 END) AS engine,
      SUM(CASE WHEN remote_url IS NOT NULL AND remote_url NOT LIKE '%${ENGINE_HOST}%' AND remote_url != '' THEN 1 ELSE 0 END) AS legacy,
      SUM(CASE WHEN remote_url IS NULL OR remote_url = '' THEN 1 ELSE 0 END) AS nulls
    FROM antojados_core.soc_media_assets
  `);
  const r = stats.recordset[0];
  report.channels['soc_media_assets'] = r;
  console.log(`   ${r.total} total, ${r.engine} engine, ${r.legacy} legacy, ${r.nulls} null`);
  if (r.legacy > 0) report.legacyOrphans.push(`soc_media_assets: ${r.legacy} URLs legacy`);

  // Verificar tipos de medio
  const types = await appPool.request().query(`
    SELECT media_type, COUNT(*) AS c
    FROM antojados_core.soc_media_assets
    WHERE remote_url IS NOT NULL AND remote_url != ''
    GROUP BY media_type
  `);
  types.recordset.forEach(t => console.log(`   type[${t.media_type}]: ${t.c}`));
}

async function auditAuthIdentities(appPool) {
  console.log('\n🔍 7. auth_identities — Avatares de usuario');
  
  const stats = await appPool.request().query(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN avatar_url LIKE '%${ENGINE_HOST}%' THEN 1 ELSE 0 END) AS engine,
      SUM(CASE WHEN avatar_url IS NOT NULL AND avatar_url NOT LIKE '%${ENGINE_HOST}%' AND avatar_url != '' THEN 1 ELSE 0 END) AS legacy,
      SUM(CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN 1 ELSE 0 END) AS nulls
    FROM antojados_core.auth_identities
  `);
  const r = stats.recordset[0];
  report.channels['auth_identities[avatar]'] = r;
  console.log(`   ${r.total} total, ${r.engine} engine, ${r.legacy} legacy, ${r.nulls} null`);
}

async function auditBizTenantTiles(appPool) {
  console.log('\n🔍 8. biz_tenant_tiles — Tiles de tenant');
  
  const stats = await appPool.request().query(`
    SELECT 
      COUNT(*) AS total,
      SUM(CASE WHEN media_url LIKE '%${ENGINE_HOST}%' THEN 1 ELSE 0 END) AS engine,
      SUM(CASE WHEN media_url IS NOT NULL AND media_url NOT LIKE '%${ENGINE_HOST}%' AND media_url != '' THEN 1 ELSE 0 END) AS legacy,
      SUM(CASE WHEN media_url IS NULL OR media_url = '' THEN 1 ELSE 0 END) AS nulls
    FROM antojados_core.biz_tenant_tiles
    WHERE media_url IS NOT NULL AND media_url != ''
  `);
  const r = stats.recordset[0];
  report.channels['biz_tenant_tiles'] = r;
  console.log(`   ${r.total} total, ${r.engine} engine, ${r.legacy} legacy, ${r.nulls} null`);
  if (r.legacy > 0) report.legacyOrphans.push(`biz_tenant_tiles: ${r.legacy} URLs legacy`);
}

async function auditFormatDiscrepancies(appPool) {
  console.log('\n🔍 9. Formato S1/S2/S3 — Verificación de variantes');
  
  // Para biz_posts: verificar que thumb_url, feed_url, full_url existan realmente
  const sample = await appPool.request().query(`
    SELECT TOP 20 bpm.thumb_url, bpm.feed_url, bpm.full_url
    FROM antojados_core.biz_post_media bpm
    WHERE bpm.thumb_url LIKE '%${ENGINE_HOST}%'
  `);
  
  let missingThumb = 0, missingFeed = 0, missingFull = 0;
  for (const row of sample.recordset) {
    const thumb = row.thumb_url?.replace(ENGINE_BASE, '') || '';
    const feed = row.feed_url?.replace(ENGINE_BASE, '') || '';
    const full = row.full_url?.replace(ENGINE_BASE, '') || '';
    
    const thumbPath = path.join(config.uploadsDir, thumb);
    const feedPath = path.join(config.uploadsDir, feed);
    const fullPath = path.join(config.uploadsDir, full);
    
    if (!fs.existsSync(thumbPath)) missingThumb++;
    if (!fs.existsSync(feedPath)) missingFeed++;
    if (!fs.existsSync(fullPath)) missingFull++;
  }
  
  console.log(`   biz_post_media (sample=${sample.recordset.length}): thumb faltantes=${missingThumb}, feed faltantes=${missingFeed}, full faltantes=${missingFull}`);
  if (missingThumb + missingFeed + missingFull > 0) {
    report.discrepancies.push(`⚠️  Variantes faltantes en disco (sample): ${missingThumb} thumb, ${missingFeed} feed, ${missingFull} full`);
  }
}

async function auditEngineBizConsistency(enginePool, appPool) {
  console.log('\n🔍 10. Consistencia Engine ↔ Biz Posts');
  
  // Ver que cada media_request ready tenga su contraparte en biz_posts o soc_posts
  const engineMedia = await enginePool.request().query(`
    SELECT mr.media_id, mr.client_reference_id, mr.status
    FROM me.media_request mr
    WHERE mr.status = 'ready'
      AND mr.client_reference_id LIKE 'migrate-%'
  `);
  
  let matched = 0, unmatched = 0;
  for (const row of engineMedia.recordset) {
    const ref = row.client_reference_id || '';
    let found = false;
    
    if (ref.includes('-biz_posts-') || ref.includes('-migrate-biz_posts-')) {
      const bizId = ref.replace(/.*-biz_posts-/, '').replace(/-[^-]+$/, '');
      const r = await appPool.request()
        .input('id', sql.NVarChar(100), bizId)
        .query('SELECT COUNT(*) AS c FROM antojados_core.biz_posts WHERE biz_post_id = @id');
      found = r.recordset[0].c > 0;
    } else if (ref.includes('-migrate-desma-')) {
      const socId = ref.replace(/.*-migrate-desma-/, '').replace(/-[^-]+$/, '');
      const r = await appPool.request()
        .input('id', sql.NVarChar(100), socId)
        .query('SELECT COUNT(*) AS c FROM antojados_core.soc_posts WHERE post_id = @id');
      found = r.recordset[0].c > 0;
    }
    
    if (found) matched++;
    else unmatched++;
  }
  
  console.log(`   ${matched} media_request ready referencian posts existentes`);
  if (unmatched > 0) {
    report.discrepancies.push(`⚠️  ${unmatched} media_request ready referencian posts NO existentes (huérfanos)`);
    console.log(`   ⚠️  ${unmatched} referencian posts NO existentes`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   AUDITORÍA FORENSE — Ecosistema de Media');
  console.log('═══════════════════════════════════════════════════════════\n');

  const enginePool = await new sql.ConnectionPool(config.sql).connect();
  const appConfig = { ...config.sql, database: 'ATLX_ANTOJADOS_APP' };
  const appPool = await new sql.ConnectionPool(appConfig).connect();

  try {
    await auditEngine(enginePool);
    await auditBizPosts(appPool);
    await auditBizPostMedia(appPool);
    await auditSocPosts(appPool);
    await auditFeedBizItems(appPool);
    await auditSocMediaAssets(appPool);
    await auditAuthIdentities(appPool);
    await auditBizTenantTiles(appPool);
    await auditFormatDiscrepancies(appPool);
    await auditEngineBizConsistency(enginePool, appPool);
    
    // ─── Reporte Final ──────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   📋 REPORTE CONSOLIDADO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('✅ ENGINE V3');
    console.log(`   Requests: ${report.engine.ready} ready, ${report.engine.failed} failed`);
    console.log(`   Originals: ${report.originals}`);
    console.log(`   Variantes: ${report.variants.total} (${Object.entries(report.variants.byCode).map(([k,v]) => `${k}:${v}`).join(', ')})`);
    
    console.log('\n✅ TABLAS DE DESTINO (URLs hacia engine)');
    for (const [key, val] of Object.entries(report.channels)) {
      const status = val.engine === val.total && val.total > 0 ? '✅' : val.engine > 0 ? '⚠️' : '🔴';
      console.log(`   ${status} ${key}: ${val.engine}/${val.total} engine (${val.legacy} legacy, ${val.nulls} null)`);
    }
    
    console.log('\n🔴 DISCREPANCIAS ENCONTRADAS');
    if (report.discrepancies.length === 0) {
      console.log('   ✅ Ninguna');
    } else {
      report.discrepancies.forEach(d => console.log(`   ${d}`));
    }
    
    console.log('\n🔴 ORPHANS LEGACY (URLs legacy sin migrar)');
    if (report.legacyOrphans.length === 0) {
      console.log('   ✅ Ninguno');
    } else {
      report.legacyOrphans.forEach(o => console.log(`   ${o}`));
    }
    
    console.log('\n🔴 ARCHIVOS FALTANTES EN DISCO');
    if (report.missingFiles.length === 0) {
      console.log('   ✅ Ninguno');
    } else {
      report.missingFiles.forEach(f => console.log(`   ${f}`));
    }
    
    // ─── Resumen Narrativo ──────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   📝 PLAN DE ACCIÓN RECOMENDADO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const priorityIssues = [];
    
    // Prioridad 1
    if (report.channels['soc_posts[desma]']?.legacy > 0 || report.channels['soc_posts[desma]']?.nulls > 0) {
      priorityIssues.push('[P1] Actualizar soc_posts[desma] con URLs del engine');
    }
    
    // Prioridad 2
    const feedBizLegacy = report.channels['feed_biz_items']?.legacy || 0;
    if (feedBizLegacy > 0) {
      priorityIssues.push(`[P2] Limpiar feed_biz_items: ${feedBizLegacy} registros legacy (seeds demo)`);
    }
    
    const smaLegacy = report.channels['soc_media_assets']?.legacy || 0;
    if (smaLegacy > 0) {
      priorityIssues.push(`[P2] Limpiar soc_media_assets: ${smaLegacy} assets legacy`);
    }
    
    // Prioridad 3
    for (const d of report.discrepancies) {
      if (d.includes('NO actualizados')) priorityIssues.push('[P1] ' + d.replace(/.*?:\s*/, ''));
      else if (d.includes('desactualizados')) priorityIssues.push('[P2] ' + d.replace(/.*?:\s*/, ''));
    }
    
    priorityIssues.forEach(i => console.log(`   ${i}`));
    
    console.log('\n   ℹ️  Nota: La deuda de seeds demo y datos legacy debe limpiarse');
    console.log('      después de que el engine esté en producción estable.');
    console.log('      No mezclar limpieza con la puesta en marcha.');
    
  } finally {
    await enginePool.close();
    await appPool.close();
  }
}

main().catch(e => { console.error('\nFATAL:', e.message); process.exit(1); });
