/*
ATLX MEDIA ENGINE V3 - 08 RIGHTS PROCEDURES
Run against ATLX_MediaEngine
Idempotent / No GO
*/

USE ATLX_MediaEngine;

SET NOCOUNT ON;
SET XACT_ABORT ON;

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_rights_origin_upsert
    @media_id UNIQUEIDENTIFIER,
    @origin_type NVARCHAR(40),
    @origin_platform NVARCHAR(40),
    @origin_url NVARCHAR(1200) = NULL,
    @original_author_name NVARCHAR(160) = NULL,
    @original_author_handle NVARCHAR(160) = NULL,
    @original_watermark_detected BIT = 0,
    @engine_watermark_policy NVARCHAR(40) = NULL,
    @ownership_type NVARCHAR(40) = NULL,
    @employment_generated BIT = 0,
    @license_scope NVARCHAR(80) = N''unknown'',
    @rights_declaration NVARCHAR(60) = N''unknown'',
    @rights_status NVARCHAR(40) = N''pending'',
    @license_type NVARCHAR(60) = N''unknown'',
    @is_demo_content BIT = 0,
    @demo_disclaimer NVARCHAR(500) = NULL,
    @allow_public_display BIT = 0,
    @allow_download BIT = 0,
    @allow_share BIT = 1,
    @allow_remix BIT = 0,
    @allow_engine_watermark BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM me.media_request WHERE media_id = @media_id)
        THROW 51001, N''MEDIA_NOT_FOUND'', 1;

    DECLARE @resolved_policy NVARCHAR(40);
    DECLARE @resolved_ownership NVARCHAR(40);
    DECLARE @resolved_license NVARCHAR(60);
    DECLARE @resolved_declaration NVARCHAR(60);
    DECLARE @resolved_public BIT;
    DECLARE @resolved_engine_wm BIT;

    SET @resolved_ownership = COALESCE(@ownership_type,
        CASE
            WHEN @origin_type = N''official_antojados'' OR COALESCE(@employment_generated,0) = 1 THEN N''company_owned''
            WHEN @origin_type = N''explorer_partner'' THEN N''licensed_to_company''
            WHEN @origin_type = N''uploaded_by_owner'' THEN N''business_owned''
            WHEN @origin_type = N''external_platform'' THEN N''third_party''
            ELSE N''unknown''
        END
    );

    SET @resolved_license = CASE
        WHEN @origin_type = N''official_antojados'' OR COALESCE(@employment_generated,0) = 1 THEN N''employee_generated''
        WHEN @origin_type = N''explorer_partner'' THEN N''explorer_partner_generated''
        ELSE COALESCE(@license_type, N''unknown'')
    END;

    SET @resolved_declaration = CASE
        WHEN @origin_type = N''official_antojados'' OR COALESCE(@employment_generated,0) = 1 THEN N''employee_work_product''
        WHEN @origin_type = N''explorer_partner'' THEN N''partner_license''
        ELSE COALESCE(@rights_declaration, N''unknown'')
    END;

    SET @resolved_policy = COALESCE(@engine_watermark_policy,
        CASE
            WHEN @origin_type = N''official_antojados'' OR COALESCE(@employment_generated,0) = 1 THEN N''apply''
            WHEN @origin_type = N''explorer_partner'' THEN N''apply''
            WHEN @origin_type IN (N''external_platform'', N''demo_content'') THEN N''preserve_external''
            WHEN @origin_type IN (N''uploaded_by_owner'', N''licensed_content'', N''created_in_antojados'') THEN N''skip''
            ELSE N''admin_review''
        END
    );

    SET @resolved_public = CASE
        WHEN @origin_type = N''official_antojados'' OR COALESCE(@employment_generated,0) = 1 THEN 1
        ELSE COALESCE(@allow_public_display, 0)
    END;

    SET @resolved_engine_wm = CASE
        WHEN @origin_type = N''official_antojados'' OR COALESCE(@employment_generated,0) = 1 THEN 1
        WHEN @origin_type = N''explorer_partner'' THEN COALESCE(@allow_engine_watermark, 1)
        ELSE COALESCE(@allow_engine_watermark, 0)
    END;

    IF EXISTS (SELECT 1 FROM me.media_rights_origin WHERE media_id = @media_id)
    BEGIN
        UPDATE me.media_rights_origin
        SET origin_type = @origin_type,
            origin_platform = @origin_platform,
            origin_url = @origin_url,
            original_author_name = @original_author_name,
            original_author_handle = @original_author_handle,
            original_watermark_detected = COALESCE(@original_watermark_detected, 0),
            engine_watermark_policy = @resolved_policy,
            ownership_type = @resolved_ownership,
            employment_generated = COALESCE(@employment_generated, 0),
            license_scope = COALESCE(@license_scope, N''unknown''),
            rights_declaration = @resolved_declaration,
            rights_status = COALESCE(@rights_status, N''pending''),
            license_type = @resolved_license,
            is_demo_content = COALESCE(@is_demo_content, 0),
            demo_disclaimer = @demo_disclaimer,
            allow_public_display = @resolved_public,
            allow_download = COALESCE(@allow_download, 0),
            allow_share = COALESCE(@allow_share, 1),
            allow_remix = COALESCE(@allow_remix, 0),
            allow_engine_watermark = @resolved_engine_wm,
            updated_at = SYSUTCDATETIME()
        WHERE media_id = @media_id;
    END
    ELSE
    BEGIN
        INSERT INTO me.media_rights_origin (
            media_id, origin_type, origin_platform, origin_url, original_author_name,
            original_author_handle, original_watermark_detected, engine_watermark_policy,
            ownership_type, employment_generated, license_scope, rights_declaration,
            rights_status, license_type, is_demo_content, demo_disclaimer,
            allow_public_display, allow_download, allow_share, allow_remix, allow_engine_watermark
        )
        VALUES (
            @media_id, @origin_type, @origin_platform, @origin_url, @original_author_name,
            @original_author_handle, COALESCE(@original_watermark_detected, 0), @resolved_policy,
            @resolved_ownership, COALESCE(@employment_generated, 0), COALESCE(@license_scope, N''unknown''), @resolved_declaration,
            COALESCE(@rights_status, N''pending''), @resolved_license, COALESCE(@is_demo_content, 0), @demo_disclaimer,
            @resolved_public, COALESCE(@allow_download, 0), COALESCE(@allow_share, 1), COALESCE(@allow_remix, 0), @resolved_engine_wm
        );
    END;

    SELECT *
    FROM me.media_rights_origin
    WHERE media_id = @media_id;
END;
');

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_rights_origin_get
    @media_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM me.media_rights_origin
    WHERE media_id = @media_id;
END;
');

EXEC(N'
CREATE OR ALTER PROCEDURE me.sp_media_rights_policy_evaluate
    @media_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        media_id,
        origin_type,
        origin_platform,
        ownership_type,
        employment_generated,
        license_scope,
        rights_status,
        license_type,
        is_demo_content,
        demo_disclaimer,
        allow_public_display,
        allow_download,
        allow_share,
        allow_remix,
        allow_engine_watermark,
        CASE
            WHEN rights_status IN (N''rejected'', N''takedown_requested'', N''removed'') THEN CAST(0 AS BIT)
            WHEN engine_watermark_policy = N''blocked'' THEN CAST(0 AS BIT)
            ELSE CAST(1 AS BIT)
        END AS can_process,
        CASE
            WHEN allow_public_display = 1 AND rights_status IN (N''declared'', N''approved'', N''restricted'', N''pending'') THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS can_publish,
        CASE
            WHEN allow_download = 1
             AND origin_type NOT IN (N''external_platform'', N''demo_content'')
             AND rights_status IN (N''declared'', N''approved'') THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS can_download,
        allow_share AS can_share,
        CASE
            WHEN engine_watermark_policy = N''apply''
             AND allow_engine_watermark = 1
             AND origin_type IN (N''official_antojados'', N''explorer_partner'', N''created_in_antojados'', N''uploaded_by_owner'', N''licensed_content'') THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS should_apply_engine_watermark,
        CASE
            WHEN origin_type IN (N''external_platform'', N''demo_content'')
              OR engine_watermark_policy = N''preserve_external'' THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS should_preserve_external_watermark,
        CASE
            WHEN rights_status = N''pending''
              OR engine_watermark_policy = N''admin_review''
              OR origin_type = N''unknown'' THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS requires_admin_review,
        CASE
            WHEN rights_status IN (N''rejected'', N''takedown_requested'', N''removed'') THEN N''rights_blocked''
            WHEN origin_type = N''official_antojados'' THEN N''official_company_content''
            WHEN origin_type = N''explorer_partner'' THEN N''partner_licensed_content''
            WHEN origin_type IN (N''external_platform'', N''demo_content'') THEN N''external_or_demo_restricted''
            ELSE N''standard_policy''
        END AS policy_reason
    FROM me.media_rights_origin
    WHERE media_id = @media_id;
END;
');

SELECT N'08_PROCEDURES_RIGHTS_OK' AS install_step;
