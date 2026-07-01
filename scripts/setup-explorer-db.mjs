/**
 * setup-explorer-db.mjs — Crea schema y tablas de Explorer en Contabo
 * 
 * Uso: node scripts/setup-explorer-db.mjs
 * Requiere conexión configurada en media-engine/.env
 */

import sql from 'mssql';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('../src/config');

async function main() {
  const appConfig = { ...config.sql, database: 'ATLX_EXPLORER_APP' };
  console.log(`Conectando a ${config.sql.server}...`);
  const pool = await new sql.ConnectionPool(appConfig).connect();
  console.log('✅ Conectado a ATLX_EXPLORER_APP');

  // Schema
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'explorer_core')
      EXEC('CREATE SCHEMA explorer_core')
  `);
  console.log('✅ Schema explorer_core');

  // Tables
  const tables = [
    `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tenants' AND schema_id = SCHEMA_ID('explorer_core'))
     CREATE TABLE explorer_core.tenants (
       tenant_id VARCHAR(50) PRIMARY KEY,
       tenant_type VARCHAR(50) NOT NULL DEFAULT 'personal',
       display_name NVARCHAR(255) NOT NULL,
       legal_name NVARCHAR(255),
       logo_url NVARCHAR(500),
       primary_color NVARCHAR(50),
       watermark_text NVARCHAR(255) DEFAULT '@AntojadosMx',
       watermark_logo_url NVARCHAR(500),
       status VARCHAR(20) DEFAULT 'active',
       created_at DATETIME2 DEFAULT GETUTCDATE(),
       updated_at DATETIME2 DEFAULT GETUTCDATE()
     )`,
    `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users' AND schema_id = SCHEMA_ID('explorer_core'))
     CREATE TABLE explorer_core.users (
       user_id VARCHAR(50) PRIMARY KEY,
       tenant_id VARCHAR(50) NOT NULL REFERENCES explorer_core.tenants(tenant_id),
       auth_provider VARCHAR(50),
       auth_subject VARCHAR(255),
       email_hash VARCHAR(255),
       display_name NVARCHAR(255) NOT NULL,
       avatar_url NVARCHAR(500),
       role VARCHAR(50) DEFAULT 'editor',
       status VARCHAR(20) DEFAULT 'active',
       created_at DATETIME2 DEFAULT GETUTCDATE(),
       updated_at DATETIME2 DEFAULT GETUTCDATE()
     )`,
    `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'projects' AND schema_id = SCHEMA_ID('explorer_core'))
     CREATE TABLE explorer_core.projects (
       project_id VARCHAR(50) PRIMARY KEY,
       tenant_id VARCHAR(50) NOT NULL REFERENCES explorer_core.tenants(tenant_id),
       owner_user_id VARCHAR(50) REFERENCES explorer_core.users(user_id),
       title NVARCHAR(500),
       tipo_post VARCHAR(50),
       tipo_content VARCHAR(50),
       efecto_global VARCHAR(50),
       composicion NVARCHAR(MAX),
       media_asset_id VARCHAR(255),
       media_url NVARCHAR(500),
       media_thumbnail_url NVARCHAR(500),
       media_feed_url NVARCHAR(500),
       media_full_url NVARCHAR(500),
       media_type VARCHAR(20),
       status VARCHAR(20) DEFAULT 'draft',
       published_at DATETIME2,
       created_at DATETIME2 DEFAULT GETUTCDATE(),
       updated_at DATETIME2 DEFAULT GETUTCDATE()
     )`,
    `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'destinations' AND schema_id = SCHEMA_ID('explorer_core'))
     CREATE TABLE explorer_core.destinations (
       destination_id VARCHAR(50) PRIMARY KEY,
       tenant_id VARCHAR(50) NOT NULL REFERENCES explorer_core.tenants(tenant_id),
       destination_type VARCHAR(50) NOT NULL,
       display_name NVARCHAR(255),
       external_ref NVARCHAR(500),
       settings_json NVARCHAR(MAX),
       status VARCHAR(20) DEFAULT 'active',
       created_at DATETIME2 DEFAULT GETUTCDATE(),
       updated_at DATETIME2 DEFAULT GETUTCDATE()
     )`,
    `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'publications' AND schema_id = SCHEMA_ID('explorer_core'))
     CREATE TABLE explorer_core.publications (
       publication_id VARCHAR(50) PRIMARY KEY,
       tenant_id VARCHAR(50) NOT NULL REFERENCES explorer_core.tenants(tenant_id),
       project_id VARCHAR(50) REFERENCES explorer_core.projects(project_id),
       destination_id VARCHAR(50) REFERENCES explorer_core.destinations(destination_id),
       external_post_id VARCHAR(255),
       feed_type VARCHAR(50),
       status VARCHAR(20) DEFAULT 'draft',
       payload_json NVARCHAR(MAX),
       error_message NVARCHAR(MAX),
       created_at DATETIME2 DEFAULT GETUTCDATE(),
       published_at DATETIME2,
       updated_at DATETIME2 DEFAULT GETUTCDATE()
     )`,
    `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'project_assets' AND schema_id = SCHEMA_ID('explorer_core'))
     CREATE TABLE explorer_core.project_assets (
       asset_id VARCHAR(50) PRIMARY KEY,
       project_id VARCHAR(50) NOT NULL REFERENCES explorer_core.projects(project_id),
       tenant_id VARCHAR(50) NOT NULL REFERENCES explorer_core.tenants(tenant_id),
       media_asset_id VARCHAR(255),
       role VARCHAR(50) DEFAULT 'source',
       original_url NVARCHAR(500),
       thumb_url NVARCHAR(500),
       feed_url NVARCHAR(500),
       full_url NVARCHAR(500),
       sort_order INT DEFAULT 0,
       status VARCHAR(20) DEFAULT 'active',
       created_at DATETIME2 DEFAULT GETUTCDATE()
     )`,
  ];

  for (let i = 0; i < tables.length; i++) {
    await pool.request().query(tables[i]);
    console.log(`  ✅ Table ${i + 1}: ${tables[i].match(/CREATE TABLE.*?(\w+)/)?.[1] || ''}`);
  }

  // Seed
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM explorer_core.tenants WHERE tenant_id = 'antojados-mx')
    INSERT INTO explorer_core.tenants (tenant_id, tenant_type, display_name, legal_name, watermark_text, primary_color)
    VALUES ('antojados-mx', 'brand', 'AntojadosMx', 'Antojados México', '@AntojadosMx', '#7c3aed')
  `);
  console.log('✅ Default tenant');

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM explorer_core.destinations WHERE destination_id = 'dst-antojados-quepex')
    INSERT INTO explorer_core.destinations (destination_id, tenant_id, destination_type, display_name, external_ref)
    VALUES ('dst-antojados-quepex', 'antojados-mx', 'antojados', 'Qué Pex Feed', 'que-pex')
  `);
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM explorer_core.destinations WHERE destination_id = 'dst-antojados-pachanga')
    INSERT INTO explorer_core.destinations (destination_id, tenant_id, destination_type, display_name, external_ref)
    VALUES ('dst-antojados-pachanga', 'antojados-mx', 'antojados', 'Pachanga Feed', 'pachanga')
  `);
  console.log('✅ Default destinations');

  // Verify
  const ver = await pool.request().query(`
    SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_CATALOG = 'ATLX_EXPLORER_APP' AND TABLE_SCHEMA = 'explorer_core'
  `);
  console.log(`\n📋 Tables (${ver.recordset.length}):`);
  ver.recordset.forEach(r => console.log(`  ${r.TABLE_SCHEMA}.${r.TABLE_NAME}`));

  await pool.close();
  console.log('\n🎉 Explorer DB setup complete!');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
