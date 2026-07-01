/**
 * dump-legacy-stats.mjs
 *
 * Script temporal para contar y listar los registros legacy que migrar.
 * Se conecta al SQL Server usando la config del Media Engine.
 *
 * Uso: node scripts/dump-legacy-stats.mjs
 */

import sql from 'mssql';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('../src/config');

async function main() {
  // Conectamos a ATLX_ANTOJADOS_APP (la BD de la app)
  const appConfig = {
    ...config.sql,
    database: 'ATLX_ANTOJADOS_APP',
  };

  console.log(`Conectando a ${appConfig.server}:${appConfig.port}/${appConfig.database}...`);
  const pool = await new sql.ConnectionPool(appConfig).connect();
  console.log('✅ Conectado!\n');

  try {
    // 1. Contar registros legacy de media
    console.log('=== 1. CONTEO DE TABLAS LEGACY ===');
    const counts = await pool.request().query(`
      SELECT 'soc_media_intake' AS tabla, COUNT(*) AS registros FROM antojados_core.soc_media_intake
      UNION ALL
      SELECT 'soc_media_assets', COUNT(*) FROM antojados_core.soc_media_assets
      UNION ALL
      SELECT 'biz_media_assets', COUNT(*) FROM antojados_core.biz_media_assets
    `);
    counts.recordset.forEach(r => console.log(`  ${r.tabla}: ${r.registros} registros`));
    console.log();

    // 2. Contenido a migrar: Vas Ir, Arre, Desma
    console.log('=== 2. CONTENIDO A MIGRAR ===');
    
    const bizPosts = await pool.request().query(`
      SELECT channel, COUNT(*) AS registros
      FROM antojados_core.biz_posts
      WHERE channel IN ('vas_ir', 'arre')
        AND media_url IS NOT NULL
      GROUP BY channel
    `);
    bizPosts.recordset.forEach(r => console.log(`  biz_posts[${r.channel}]: ${r.registros} posts con media`));

    const desmaPosts = await pool.request().query(`
      SELECT COUNT(*) AS registros
      FROM antojados_core.soc_posts
      WHERE feed_type = 'desma'
        AND media_url IS NOT NULL
    `);
    console.log(`  soc_posts[desma]: ${desmaPosts.recordset[0].registros} posts con media`);
    console.log();

    // 3. Detalle de los registros a migrar
    console.log('=== 3. DETALLE: Vas Ir y Arre ===');
    const bizDetail = await pool.request().query(`
      SELECT 
        bp.biz_post_id AS id,
        bp.channel,
        bp.publication_type,
        bp.title,
        bp.media_url,
        bpm.thumb_url,
        bpm.feed_url,
        bpm.full_url,
        bp.created_at,
        bp.publisher_user_id
      FROM antojados_core.biz_posts bp
      LEFT JOIN antojados_core.biz_post_media bpm ON bpm.post_id = bp.biz_post_id
      WHERE bp.channel IN ('vas_ir', 'arre')
        AND (bp.media_url IS NOT NULL OR bpm.media_url IS NOT NULL)
      ORDER BY bp.channel, bp.created_at
    `);
    if (bizDetail.recordset.length === 0) {
      console.log('  (sin registros)');
    } else {
      bizDetail.recordset.forEach(r => {
        console.log(`  [${r.channel}] ${r.id}: "${r.title || '(sin titulo)'}"`);
        console.log(`    media_url: ${r.media_url || '(null)'}`);
        console.log(`    thumb_url: ${r.thumb_url || '(null)'}`);
        console.log(`    feed_url: ${r.feed_url || '(null)'}`);
        console.log(`    full_url: ${r.full_url || '(null)'}`);
        console.log(`    creado: ${r.created_at}, por: ${r.publisher_user_id}`);
        console.log();
      });
    }

    console.log('=== 4. DETALLE: En el Desma ===');
    const desmaDetail = await pool.request().query(`
      SELECT 
        post_id AS id,
        feed_type,
        title,
        body,
        media_url,
        media_thumbnail_url,
        media_feed_url,
        media_full_url,
        published_at,
        user_id
      FROM antojados_core.soc_posts
      WHERE feed_type = 'desma'
        AND media_url IS NOT NULL
      ORDER BY published_at
    `);
    if (desmaDetail.recordset.length === 0) {
      console.log('  (sin registros)');
    } else {
      desmaDetail.recordset.forEach(r => {
        console.log(`  ${r.id}: "${r.title || '(sin titulo)'}"`);
        console.log(`    media_url: ${r.media_url || '(null)'}`);
        console.log(`    media_feed_url: ${r.media_feed_url || '(null)'}`);
        console.log(`    media_full_url: ${r.media_full_url || '(null)'}`);
        console.log(`    publicado: ${r.published_at}, por: ${r.user_id}`);
        console.log();
      });
    }

    // 5. Tester posts (para confirmar descarte)
    console.log('=== 5. POSTS TESTER (para descartar) ===');
    const testers = await pool.request().query(`
      SELECT TOP 5 post_id AS id, title, media_url, published_at
      FROM antojados_core.soc_posts
      WHERE feed_type NOT IN ('desma', 'neta', 'momento', 'pachanga', 'barrio')
         OR feed_type IS NULL
      ORDER BY published_at DESC
    `);
    if (testers.recordset.length === 0) {
      console.log('  (sin registros)');
    } else {
      testers.recordset.forEach(r => {
        console.log(`  ${r.id}: "${r.title || '(sin titulo)'}" media_url=${r.media_url || 'null'}`);
      });
    }

  } finally {
    await pool.close();
  }
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
