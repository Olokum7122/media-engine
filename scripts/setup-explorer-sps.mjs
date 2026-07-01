/**
 * setup-explorer-sps.mjs — Crea Stored Procedures de Explorer App en Contabo
 *
 * Uso: node scripts/setup-explorer-sps.mjs
 * Requiere conexión configurada en media-engine/.env
 *
 * Crea los SPs documentados en:
 *   explorer-app/docs/EXPLORER_APP_V1/06_DATABASE_CONTRACT.md
 *
 * Y el seed de usuario demo.
 */

import sql from 'mssql';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('../src/config');

// ─── SPs ─────────────────────────────────────────────────────────────────────

const SP_PROJECT_CREATE = `
CREATE OR ALTER PROCEDURE explorer_core.usp_project_create
    @project_id VARCHAR(50),
    @tenant_id VARCHAR(50),
    @owner_user_id VARCHAR(50) = NULL,
    @title NVARCHAR(500) = NULL,
    @tipo_post VARCHAR(50) = NULL,
    @tipo_content VARCHAR(50) = NULL,
    @efecto_global VARCHAR(50) = NULL,
    @composicion NVARCHAR(MAX) = NULL,
    @media_asset_id VARCHAR(255) = NULL,
    @media_url NVARCHAR(500) = NULL,
    @media_thumbnail_url NVARCHAR(500) = NULL,
    @media_feed_url NVARCHAR(500) = NULL,
    @media_full_url NVARCHAR(500) = NULL,
    @media_type VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO explorer_core.projects (
        project_id, tenant_id, owner_user_id, title,
        tipo_post, tipo_content, efecto_global, composicion,
        media_asset_id, media_url, media_thumbnail_url,
        media_feed_url, media_full_url, media_type
    ) VALUES (
        @project_id, @tenant_id, @owner_user_id, @title,
        @tipo_post, @tipo_content, @efecto_global, @composicion,
        @media_asset_id, @media_url, @media_thumbnail_url,
        @media_feed_url, @media_full_url, @media_type
    );
    SELECT * FROM explorer_core.projects WHERE project_id = @project_id;
END;
`;

const SP_PROJECT_GET = `
CREATE OR ALTER PROCEDURE explorer_core.usp_project_get
    @project_id VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM explorer_core.projects WHERE project_id = @project_id;
END;
`;

const SP_PROJECT_LIST = `
CREATE OR ALTER PROCEDURE explorer_core.usp_project_list
    @tenant_id VARCHAR(50),
    @owner_user_id VARCHAR(50) = NULL,
    @status VARCHAR(20) = NULL,
    @tipo_post VARCHAR(50) = NULL,
    @limit INT = 50,
    @offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM explorer_core.projects
    WHERE tenant_id = @tenant_id
      AND (@owner_user_id IS NULL OR owner_user_id = @owner_user_id)
      AND (@status IS NULL OR status = @status)
      AND (@tipo_post IS NULL OR tipo_post = @tipo_post)
    ORDER BY created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;

    SELECT COUNT(*) AS total
    FROM explorer_core.projects
    WHERE tenant_id = @tenant_id
      AND (@owner_user_id IS NULL OR owner_user_id = @owner_user_id)
      AND (@status IS NULL OR status = @status)
      AND (@tipo_post IS NULL OR tipo_post = @tipo_post);
END;
`;

const SP_PROJECT_UPDATE = `
CREATE OR ALTER PROCEDURE explorer_core.usp_project_update
    @project_id VARCHAR(50),
    @title NVARCHAR(500) = NULL,
    @tipo_post VARCHAR(50) = NULL,
    @tipo_content VARCHAR(50) = NULL,
    @efecto_global VARCHAR(50) = NULL,
    @composicion NVARCHAR(MAX) = NULL,
    @media_asset_id VARCHAR(255) = NULL,
    @media_url NVARCHAR(500) = NULL,
    @media_thumbnail_url NVARCHAR(500) = NULL,
    @media_feed_url NVARCHAR(500) = NULL,
    @media_full_url NVARCHAR(500) = NULL,
    @media_type VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE explorer_core.projects
    SET title = ISNULL(@title, title),
        tipo_post = ISNULL(@tipo_post, tipo_post),
        tipo_content = ISNULL(@tipo_content, tipo_content),
        efecto_global = ISNULL(@efecto_global, efecto_global),
        composicion = ISNULL(@composicion, composicion),
        media_asset_id = ISNULL(@media_asset_id, media_asset_id),
        media_url = ISNULL(@media_url, media_url),
        media_thumbnail_url = ISNULL(@media_thumbnail_url, media_thumbnail_url),
        media_feed_url = ISNULL(@media_feed_url, media_feed_url),
        media_full_url = ISNULL(@media_full_url, media_full_url),
        media_type = ISNULL(@media_type, media_type),
        updated_at = GETUTCDATE()
    WHERE project_id = @project_id;
    SELECT * FROM explorer_core.projects WHERE project_id = @project_id;
END;
`;

const SP_PROJECT_SET_STATUS = `
CREATE OR ALTER PROCEDURE explorer_core.usp_project_set_status
    @project_id VARCHAR(50),
    @status VARCHAR(20),
    @published_at DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE explorer_core.projects
    SET status = @status,
        published_at = CASE WHEN @status = 'published' THEN ISNULL(@published_at, GETUTCDATE()) ELSE published_at END,
        updated_at = GETUTCDATE()
    WHERE project_id = @project_id;
    SELECT * FROM explorer_core.projects WHERE project_id = @project_id;
END;
`;

const SP_PROJECT_ASSET_ATTACH = `
CREATE OR ALTER PROCEDURE explorer_core.usp_project_asset_attach
    @asset_id VARCHAR(50),
    @project_id VARCHAR(50),
    @tenant_id VARCHAR(50),
    @media_asset_id VARCHAR(255) = NULL,
    @role VARCHAR(50) = 'source',
    @original_url NVARCHAR(500) = NULL,
    @thumb_url NVARCHAR(500) = NULL,
    @feed_url NVARCHAR(500) = NULL,
    @full_url NVARCHAR(500) = NULL,
    @sort_order INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO explorer_core.project_assets (
        asset_id, project_id, tenant_id, media_asset_id, role,
        original_url, thumb_url, feed_url, full_url, sort_order
    ) VALUES (
        @asset_id, @project_id, @tenant_id, @media_asset_id, @role,
        @original_url, @thumb_url, @feed_url, @full_url, @sort_order
    );
    SELECT * FROM explorer_core.project_assets WHERE asset_id = @asset_id;
END;
`;

const SP_TENANT_CREATE = `
CREATE OR ALTER PROCEDURE explorer_core.usp_tenant_create
    @tenant_id VARCHAR(50),
    @tenant_type VARCHAR(50) = 'personal',
    @display_name NVARCHAR(255),
    @legal_name NVARCHAR(255) = NULL,
    @logo_url NVARCHAR(500) = NULL,
    @primary_color NVARCHAR(50) = NULL,
    @watermark_text NVARCHAR(255) = NULL,
    @watermark_logo_url NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO explorer_core.tenants (
        tenant_id, tenant_type, display_name, legal_name,
        logo_url, primary_color, watermark_text, watermark_logo_url
    ) VALUES (
        @tenant_id, @tenant_type, @display_name, @legal_name,
        @logo_url, @primary_color,
        ISNULL(@watermark_text, '@AntojadosMx'), @watermark_logo_url
    );
    SELECT * FROM explorer_core.tenants WHERE tenant_id = @tenant_id;
END;
`;

const SP_TENANT_GET = `
CREATE OR ALTER PROCEDURE explorer_core.usp_tenant_get
    @tenant_id VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM explorer_core.tenants WHERE tenant_id = @tenant_id;
END;
`;

const SP_TENANT_LIST = `
CREATE OR ALTER PROCEDURE explorer_core.usp_tenant_list
    @status VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM explorer_core.tenants
    WHERE (@status IS NULL OR status = @status)
    ORDER BY display_name;
END;
`;

const SP_USER_UPSERT_FROM_AUTH = `
CREATE OR ALTER PROCEDURE explorer_core.usp_user_upsert_from_auth
    @user_id VARCHAR(50),
    @tenant_id VARCHAR(50),
    @auth_provider VARCHAR(50) = NULL,
    @auth_subject VARCHAR(255) = NULL,
    @email_hash VARCHAR(255) = NULL,
    @display_name NVARCHAR(255),
    @avatar_url NVARCHAR(500) = NULL,
    @role VARCHAR(50) = 'editor'
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM explorer_core.users WHERE user_id = @user_id)
    BEGIN
        UPDATE explorer_core.users
        SET auth_provider = ISNULL(@auth_provider, auth_provider),
            auth_subject = ISNULL(@auth_subject, auth_subject),
            email_hash = ISNULL(@email_hash, email_hash),
            display_name = @display_name,
            avatar_url = ISNULL(@avatar_url, avatar_url),
            role = ISNULL(@role, role),
            updated_at = GETUTCDATE()
        WHERE user_id = @user_id;
    END
    ELSE
    BEGIN
        INSERT INTO explorer_core.users (
            user_id, tenant_id, auth_provider, auth_subject,
            email_hash, display_name, avatar_url, role
        ) VALUES (
            @user_id, @tenant_id, @auth_provider, @auth_subject,
            @email_hash, @display_name, @avatar_url, @role
        );
    END;
    SELECT * FROM explorer_core.users WHERE user_id = @user_id;
END;
`;

const SP_USER_GET = `
CREATE OR ALTER PROCEDURE explorer_core.usp_user_get
    @user_id VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM explorer_core.users WHERE user_id = @user_id;
END;
`;

const SP_USER_LIST_BY_TENANT = `
CREATE OR ALTER PROCEDURE explorer_core.usp_user_list_by_tenant
    @tenant_id VARCHAR(50),
    @status VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM explorer_core.users
    WHERE tenant_id = @tenant_id
      AND (@status IS NULL OR status = @status)
    ORDER BY display_name;
END;
`;

const SP_DESTINATION_UPSERT = `
CREATE OR ALTER PROCEDURE explorer_core.usp_destination_upsert
    @destination_id VARCHAR(50),
    @tenant_id VARCHAR(50),
    @destination_type VARCHAR(50),
    @display_name NVARCHAR(255) = NULL,
    @external_ref NVARCHAR(500) = NULL,
    @settings_json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM explorer_core.destinations WHERE destination_id = @destination_id)
    BEGIN
        UPDATE explorer_core.destinations
        SET destination_type = ISNULL(@destination_type, destination_type),
            display_name = ISNULL(@display_name, display_name),
            external_ref = ISNULL(@external_ref, external_ref),
            settings_json = ISNULL(@settings_json, settings_json),
            updated_at = GETUTCDATE()
        WHERE destination_id = @destination_id;
    END
    ELSE
    BEGIN
        INSERT INTO explorer_core.destinations (
            destination_id, tenant_id, destination_type, display_name,
            external_ref, settings_json
        ) VALUES (
            @destination_id, @tenant_id, @destination_type, @display_name,
            @external_ref, @settings_json
        );
    END;
    SELECT * FROM explorer_core.destinations WHERE destination_id = @destination_id;
END;
`;

const SP_DESTINATION_LIST = `
CREATE OR ALTER PROCEDURE explorer_core.usp_destination_list
    @tenant_id VARCHAR(50),
    @destination_type VARCHAR(50) = NULL,
    @status VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM explorer_core.destinations
    WHERE tenant_id = @tenant_id
      AND (@destination_type IS NULL OR destination_type = @destination_type)
      AND (@status IS NULL OR status = @status)
    ORDER BY display_name;
END;
`;

const SP_PUBLICATION_CREATE = `
CREATE OR ALTER PROCEDURE explorer_core.usp_publication_create
    @publication_id VARCHAR(50),
    @tenant_id VARCHAR(50),
    @project_id VARCHAR(50) = NULL,
    @destination_id VARCHAR(50) = NULL,
    @external_post_id VARCHAR(255) = NULL,
    @feed_type VARCHAR(50) = NULL,
    @payload_json NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO explorer_core.publications (
        publication_id, tenant_id, project_id, destination_id,
        external_post_id, feed_type, payload_json
    ) VALUES (
        @publication_id, @tenant_id, @project_id, @destination_id,
        @external_post_id, @feed_type, @payload_json
    );
    SELECT * FROM explorer_core.publications WHERE publication_id = @publication_id;
END;
`;

const SP_PUBLICATION_MARK_PUBLISHED = `
CREATE OR ALTER PROCEDURE explorer_core.usp_publication_mark_published
    @publication_id VARCHAR(50),
    @external_post_id VARCHAR(255) = NULL,
    @published_at DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE explorer_core.publications
    SET status = 'published',
        external_post_id = ISNULL(@external_post_id, external_post_id),
        published_at = ISNULL(@published_at, GETUTCDATE()),
        updated_at = GETUTCDATE()
    WHERE publication_id = @publication_id;
    SELECT * FROM explorer_core.publications WHERE publication_id = @publication_id;
END;
`;

const SP_PUBLICATION_MARK_ERROR = `
CREATE OR ALTER PROCEDURE explorer_core.usp_publication_mark_error
    @publication_id VARCHAR(50),
    @error_message NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE explorer_core.publications
    SET status = 'error',
        error_message = @error_message,
        updated_at = GETUTCDATE()
    WHERE publication_id = @publication_id;
    SELECT * FROM explorer_core.publications WHERE publication_id = @publication_id;
END;
`;

const SP_PUBLICATION_LIST = `
CREATE OR ALTER PROCEDURE explorer_core.usp_publication_list
    @tenant_id VARCHAR(50),
    @project_id VARCHAR(50) = NULL,
    @status VARCHAR(20) = NULL,
    @feed_type VARCHAR(50) = NULL,
    @limit INT = 50,
    @offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM explorer_core.publications
    WHERE tenant_id = @tenant_id
      AND (@project_id IS NULL OR project_id = @project_id)
      AND (@status IS NULL OR status = @status)
      AND (@feed_type IS NULL OR feed_type = @feed_type)
    ORDER BY created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;

    SELECT COUNT(*) AS total
    FROM explorer_core.publications
    WHERE tenant_id = @tenant_id
      AND (@project_id IS NULL OR project_id = @project_id)
      AND (@status IS NULL OR status = @status)
      AND (@feed_type IS NULL OR feed_type = @feed_type);
END;
`;

const SEED_USER_DEMO = `
IF NOT EXISTS (SELECT * FROM explorer_core.users WHERE user_id = 'explorer-demo-user')
BEGIN
    INSERT INTO explorer_core.users (
        user_id, tenant_id, auth_provider, auth_subject,
        email_hash, display_name, avatar_url, role
    ) VALUES (
        'explorer-demo-user',
        'antojados-mx',
        'dev-seed',
        'dev-seed-explorer-demo',
        HASHBYTES('SHA2_256', 'demo@antojados.mx'),
        'Explorador Demo',
        NULL,
        'editor'
    );
END;
`;

// ─── Runner ──────────────────────────────────────────────────────────────────

const sps = [
  { name: 'usp_tenant_create',     sql: SP_TENANT_CREATE },
  { name: 'usp_tenant_get',        sql: SP_TENANT_GET },
  { name: 'usp_tenant_list',       sql: SP_TENANT_LIST },
  { name: 'usp_user_upsert_from_auth', sql: SP_USER_UPSERT_FROM_AUTH },
  { name: 'usp_user_get',          sql: SP_USER_GET },
  { name: 'usp_user_list_by_tenant', sql: SP_USER_LIST_BY_TENANT },
  { name: 'usp_project_create',    sql: SP_PROJECT_CREATE },
  { name: 'usp_project_get',       sql: SP_PROJECT_GET },
  { name: 'usp_project_list',      sql: SP_PROJECT_LIST },
  { name: 'usp_project_update',    sql: SP_PROJECT_UPDATE },
  { name: 'usp_project_set_status', sql: SP_PROJECT_SET_STATUS },
  { name: 'usp_project_asset_attach', sql: SP_PROJECT_ASSET_ATTACH },
  { name: 'usp_destination_upsert', sql: SP_DESTINATION_UPSERT },
  { name: 'usp_destination_list',  sql: SP_DESTINATION_LIST },
  { name: 'usp_publication_create', sql: SP_PUBLICATION_CREATE },
  { name: 'usp_publication_mark_published', sql: SP_PUBLICATION_MARK_PUBLISHED },
  { name: 'usp_publication_mark_error', sql: SP_PUBLICATION_MARK_ERROR },
  { name: 'usp_publication_list',  sql: SP_PUBLICATION_LIST },
];

async function main() {
  const appConfig = { ...config.sql, database: 'ATLX_EXPLORER_APP' };
  console.log(`Conectando a ${config.sql.server}...`);
  const pool = await new sql.ConnectionPool(appConfig).connect();
  console.log('✅ Conectado a ATLX_EXPLORER_APP');

  // Crear SPs
  let ok = 0;
  let fail = 0;

  for (const sp of sps) {
    try {
      await pool.request().query(sp.sql);
      console.log(`  ✅ ${sp.name}`);
      ok++;
    } catch (err) {
      console.error(`  ❌ ${sp.name}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n📊 SPs: ${ok} creados, ${fail} fallidos`);

  // Seed usuario demo
  try {
    await pool.request().query(SEED_USER_DEMO);
    console.log('✅ Seed user: explorer-demo-user');
  } catch (err) {
    console.error(`❌ Seed user falló: ${err.message}`);
  }

  // Verificar
  const ver = await pool.request().query(`
    SELECT SPECIFIC_SCHEMA, SPECIFIC_NAME AS procedure_name
    FROM INFORMATION_SCHEMA.ROUTINES
    WHERE ROUTINE_TYPE = 'PROCEDURE'
      AND ROUTINE_SCHEMA = 'explorer_core'
    ORDER BY SPECIFIC_NAME
  `);

  console.log(`\n📋 SPs instalados (${ver.recordset.length}):`);
  ver.recordset.forEach(r => console.log(`  ${r.SPECIFIC_SCHEMA}.${r.procedure_name}`));

  await pool.close();
  console.log('\n🎉 Explorer SPs setup complete!');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
