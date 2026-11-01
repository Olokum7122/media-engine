-- Reversión de la purga de 246 processing_job en estado failed (2026-10-31).
-- Los media_request y sus variantes NO se tocaron: sólo se eliminan las filas de job.
-- Los eventos de media_event_log referencian job_id sin FK, siguen intactos.
USE Atlx_Mediaengine;
BEGIN TRANSACTION;
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 142, '8C7FE39A-7611-4049-A399-7449A00B0574', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:39:52.721Z', SYSUTCDATETIME(), '2026-06-29T05:39:55.232Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=142);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 144, '3094CF0C-3731-439F-B4BC-C520AFDB2175', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:40:56.475Z', SYSUTCDATETIME(), '2026-06-29T05:40:58.718Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=144);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 146, '4E4BDCC6-83C0-4142-8074-453568D10949', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:41:40.492Z', SYSUTCDATETIME(), '2026-06-29T05:41:42.747Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=146);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 148, '64C167A0-3C63-4E07-A228-7989453D0C89', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:42:13.413Z', SYSUTCDATETIME(), '2026-06-29T05:42:15.707Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=148);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 150, '41460EFE-BBBC-4D5A-AA0F-932DD8869066', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:44:29.852Z', SYSUTCDATETIME(), '2026-06-29T05:44:32.145Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=150);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 152, '6F2CEB6F-E473-4817-9AEF-8524C706A901', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:45:43.489Z', SYSUTCDATETIME(), '2026-06-29T05:45:45.954Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=152);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 154, '40308143-A5A9-4ED3-A172-ED00DCC7B840', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:46:05.098Z', SYSUTCDATETIME(), '2026-06-29T05:46:07.378Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=154);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 156, 'AE5D31A7-F50E-4695-9EB7-08C30B78DC1D', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:47:14.828Z', SYSUTCDATETIME(), '2026-06-29T05:47:17.274Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=156);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 158, 'BE446338-4AA5-4896-B21E-77EE6E86CD38', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:48:24.775Z', SYSUTCDATETIME(), '2026-06-29T05:48:27.054Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=158);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 160, '038157AB-24D3-40B2-B317-C2BB6C6F95C8', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:49:05.161Z', SYSUTCDATETIME(), '2026-06-29T05:49:07.598Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=160);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 162, 'EBFA1BA6-8E74-429C-B7B9-74BE965B5EB0', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:49:40.063Z', SYSUTCDATETIME(), '2026-06-29T05:49:42.329Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=162);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 164, '898BD68F-633D-4F50-9042-25836B9FF2AB', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:50:14.371Z', SYSUTCDATETIME(), '2026-06-29T05:50:16.671Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=164);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 166, '95B8A1F8-ACBF-4FE7-8AA5-520EEF8D05DF', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:51:09.793Z', SYSUTCDATETIME(), '2026-06-29T05:51:12.274Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=166);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 168, '284DCD1D-2C17-4364-AC7A-E9E8FAE6F559', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:52:41.388Z', SYSUTCDATETIME(), '2026-06-29T05:52:43.885Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=168);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 170, '378AA679-ABE9-4395-95A4-4F3E1D6F4D2E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:53:15.665Z', SYSUTCDATETIME(), '2026-06-29T05:53:18.126Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=170);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 172, '10910357-04EC-4A3D-9BE8-35E4A97B7394', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:54:12.448Z', SYSUTCDATETIME(), '2026-06-29T05:54:14.692Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=172);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 174, 'F7F0FC6F-1FCD-4FC3-AC25-9203B7F10F8F', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:54:55.657Z', SYSUTCDATETIME(), '2026-06-29T05:54:58.078Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=174);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 176, 'A877A04B-878D-4F24-B36D-8E24332BD195', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:56:23.862Z', SYSUTCDATETIME(), '2026-06-29T05:56:26.359Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=176);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 178, 'F46D3FFF-F7C0-43C0-AB6F-02246D295E4A', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:56:47.572Z', SYSUTCDATETIME(), '2026-06-29T05:56:49.831Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=178);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 180, 'C2091301-F115-469F-A5B9-90E66F314DA9', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:57:09.659Z', SYSUTCDATETIME(), '2026-06-29T05:57:11.907Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=180);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 182, '34858009-0755-4B49-B03C-98515F3E5BD0', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:57:41.228Z', SYSUTCDATETIME(), '2026-06-29T05:57:43.689Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=182);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 184, 'B9718125-6DAE-4849-B5A0-7E7AC176343E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:58:13.933Z', SYSUTCDATETIME(), '2026-06-29T05:58:16.385Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=184);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 186, 'E01C8792-088E-4BF7-8CF4-365467B83CF6', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:58:46.083Z', SYSUTCDATETIME(), '2026-06-29T05:58:48.369Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=186);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 188, '232601CF-A40F-42AC-B8F4-D9C9409F1B9F', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:59:11.852Z', SYSUTCDATETIME(), '2026-06-29T05:59:14.297Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=188);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 190, 'CE992A5B-4B91-4E75-A3B0-DEEA9C23E87F', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:59:40.549Z', SYSUTCDATETIME(), '2026-06-29T05:59:42.881Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=190);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 192, '017F4D32-E744-4A35-9BEF-E8DAF7804B1C', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T05:59:56.701Z', SYSUTCDATETIME(), '2026-06-29T05:59:58.938Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=192);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 194, '47B5DEB0-C398-4CAA-A222-6F5BA17E87C7', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:00:24.328Z', SYSUTCDATETIME(), '2026-06-29T06:00:26.567Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=194);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 196, 'C6A0DFC4-0687-4722-B98D-FD1016BF789A', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:01:09.094Z', SYSUTCDATETIME(), '2026-06-29T06:01:11.370Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=196);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 198, 'F681A315-0DFA-4827-B488-9D71FEC841BF', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:02:23.437Z', SYSUTCDATETIME(), '2026-06-29T06:02:25.909Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=198);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 200, '5D7DD095-774F-47FB-8102-66F067B6802A', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:02:41.907Z', SYSUTCDATETIME(), '2026-06-29T06:02:44.155Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=200);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 202, '79FA8EAA-1BA3-4651-8F4C-1DEF6127997E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:03:35.893Z', SYSUTCDATETIME(), '2026-06-29T06:03:38.339Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=202);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 204, 'CE5683D4-8FC5-40B1-93E3-7267DB64F1EF', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:03:54.026Z', SYSUTCDATETIME(), '2026-06-29T06:03:56.301Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=204);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 206, '40352B9C-BFCB-4643-B8F9-86CC2AB58D5A', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:04:15.497Z', SYSUTCDATETIME(), '2026-06-29T06:04:17.809Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=206);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 208, '9DBD14C6-A062-4632-B18E-211D2F2F4EA6', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:04:38.582Z', SYSUTCDATETIME(), '2026-06-29T06:04:40.842Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=208);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 210, '6C042F7E-46B0-4A3A-87BA-39F286279BCE', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:05:47.935Z', SYSUTCDATETIME(), '2026-06-29T06:05:50.391Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=210);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 212, '35C22964-533B-4843-9EE1-35CB7D054798', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:06:05.404Z', SYSUTCDATETIME(), '2026-06-29T06:06:07.716Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=212);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 214, 'E70AF822-CE55-4426-9705-83C0FDB02D93', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:06:33.829Z', SYSUTCDATETIME(), '2026-06-29T06:06:36.101Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=214);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 216, '5A081526-EE8E-45A5-8E2D-F58E70E709B9', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:06:51.313Z', SYSUTCDATETIME(), '2026-06-29T06:06:53.581Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=216);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 218, '81EF8055-8D7D-4783-A163-A448973DEB04', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:07:47.873Z', SYSUTCDATETIME(), '2026-06-29T06:07:50.305Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=218);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 220, '40B27D56-7AEE-4211-B6E7-17661A89A3FA', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-29T06:08:31.548Z', SYSUTCDATETIME(), '2026-06-29T06:08:33.787Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=220);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 222, '08A34520-9508-4177-A318-CFCEE859E9E1', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-30T15:47:47.969Z', SYSUTCDATETIME(), '2026-06-30T15:47:51.305Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=222);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 224, 'D218BC98-3C9A-485A-BE11-5BC6BCF8F8AB', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-30T16:07:02.750Z', SYSUTCDATETIME(), '2026-06-30T16:07:06.293Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=224);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 226, '0035630A-2959-4A73-BCEC-2F74C0F7F0D6', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-06-30T17:55:18.775Z', SYSUTCDATETIME(), '2026-06-30T17:55:22.048Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=226);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 228, 'C87AE4B3-6473-4AC8-AC3A-854F5D94289F', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:24:52.696Z', SYSUTCDATETIME(), '2026-07-09T21:24:52.897Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=228);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 230, '68F45503-80EB-43C0-ABBE-336B1D7D511E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:41:07.906Z', SYSUTCDATETIME(), '2026-07-09T21:41:08.275Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=230);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 232, '7F5A2379-2BB3-4371-8DD3-3E67BE48FD9D', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:41:22.654Z', SYSUTCDATETIME(), '2026-07-09T21:41:22.976Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=232);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 234, 'B7196D4B-993C-463E-B9F8-C4E65C6D3C7E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:41:37.553Z', SYSUTCDATETIME(), '2026-07-09T21:41:37.771Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=234);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 236, '8C32A26A-401E-4DF8-AA87-0CF07184BF00', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:41:52.509Z', SYSUTCDATETIME(), '2026-07-09T21:41:52.736Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=236);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 239, 'C8BADF7E-3FDC-47B1-8B1C-846009668C24', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:42:07.740Z', SYSUTCDATETIME(), '2026-07-09T21:42:09.365Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=239);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 240, '5EE2EE6C-1B05-4828-B80C-7F802FFB5370', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:42:09.093Z', SYSUTCDATETIME(), '2026-07-09T21:42:21.739Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=240);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 242, '8F5CE29F-0236-43CE-8BC9-E511FE37552C', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:42:22.639Z', SYSUTCDATETIME(), '2026-07-09T21:42:22.842Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=242);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 244, 'A9C86FF4-79F8-4F43-9C53-5BF4303397A8', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:42:37.509Z', SYSUTCDATETIME(), '2026-07-09T21:42:37.682Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=244);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 246, '0EE1D8B2-DA56-48F4-AA03-EC9F5CBAC479', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:42:52.504Z', SYSUTCDATETIME(), '2026-07-09T21:42:52.725Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=246);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 248, 'ADA97236-EDBB-412F-A98E-17C96A0BCD7F', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:43:07.656Z', SYSUTCDATETIME(), '2026-07-09T21:43:07.840Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=248);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 251, 'FE05D33B-075C-4FBE-A35D-6C9C23B2F347', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:43:22.349Z', SYSUTCDATETIME(), '2026-07-09T21:43:23.587Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=251);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 252, 'A95E531B-40E6-416C-8FC9-AFDF9CF6145A', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:43:23.423Z', SYSUTCDATETIME(), '2026-07-09T21:43:36.774Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=252);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 254, 'D8B55CC5-6F02-4911-AD66-C7573DE79AED', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:43:37.798Z', SYSUTCDATETIME(), '2026-07-09T21:43:37.973Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=254);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 256, '91D805F4-9E7E-4F13-95D7-3453521592CB', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:43:52.603Z', SYSUTCDATETIME(), '2026-07-09T21:43:52.795Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=256);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 258, '1FE6419E-40C5-41DC-A61A-DFA05527CD4C', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:44:07.819Z', SYSUTCDATETIME(), '2026-07-09T21:44:08.077Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=258);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 260, 'A78BC14D-F38E-4370-8377-6DF6FF94F694', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:44:37.728Z', SYSUTCDATETIME(), '2026-07-09T21:44:37.931Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=260);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 262, 'A9787423-10D5-4B2A-B1CA-69C34122D751', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:44:52.708Z', SYSUTCDATETIME(), '2026-07-09T21:44:52.990Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=262);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 264, 'F29224FC-0291-4A59-B482-CCDABAF441A5', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:45:07.604Z', SYSUTCDATETIME(), '2026-07-09T21:45:07.841Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=264);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 266, 'C03852A4-5B3E-4A2C-B582-BE2A8D369684', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:45:22.550Z', SYSUTCDATETIME(), '2026-07-09T21:45:22.739Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=266);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 268, 'C15F7F59-5504-4632-B9F3-FE991C2D11FD', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:45:37.606Z', SYSUTCDATETIME(), '2026-07-09T21:45:37.815Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=268);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 270, '93D3F85A-28A5-419A-9A86-A76CEA962D24', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:45:52.378Z', SYSUTCDATETIME(), '2026-07-09T21:45:52.566Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=270);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 272, '76EFC9F5-8F44-48D8-A18F-F69C870B1E5D', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:46:07.605Z', SYSUTCDATETIME(), '2026-07-09T21:46:07.824Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=272);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 274, 'DAF47740-289B-4B2E-B657-1F081BD900F6', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:46:22.639Z', SYSUTCDATETIME(), '2026-07-09T21:46:22.818Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=274);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 276, '4AF65CBA-BAC9-4FAE-AC2B-D976ED4009E9', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:46:37.581Z', SYSUTCDATETIME(), '2026-07-09T21:46:37.768Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=276);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 278, '00025720-B7F6-4931-922A-D39E1D4CB2AF', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-09T21:46:52.774Z', SYSUTCDATETIME(), '2026-07-09T21:46:53.089Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=278);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 280, '7737AC6D-9049-440F-A0A6-BB24595242D1', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:02:08.725Z', SYSUTCDATETIME(), '2026-07-10T02:02:09.030Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=280);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 282, 'A8F5E3DD-54A4-499B-AD6A-08EA89813D53', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:02:23.608Z', SYSUTCDATETIME(), '2026-07-10T02:02:23.826Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=282);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 284, '164D1098-D137-4F6F-BF2D-53474EA00408', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:02:38.387Z', SYSUTCDATETIME(), '2026-07-10T02:02:38.588Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=284);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 286, '31EE35E0-DD0F-4095-A961-E6F6F9A89331', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:02:53.365Z', SYSUTCDATETIME(), '2026-07-10T02:02:53.640Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=286);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 288, 'C097E8C3-8ADC-4D15-ACCB-B355FD660942', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:03:08.488Z', SYSUTCDATETIME(), '2026-07-10T02:03:08.693Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=288);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 290, 'E97CF3BF-7B6F-49FB-B0ED-1E3D97C0BF0A', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:03:23.221Z', SYSUTCDATETIME(), '2026-07-10T02:03:23.417Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=290);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 292, '9B3FDA1E-A456-41DC-8DF3-F396B4403504', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:03:38.397Z', SYSUTCDATETIME(), '2026-07-10T02:03:38.585Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=292);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 294, 'FBF817D9-47CD-4BE6-9EEB-A4A7CD935174', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:03:53.605Z', SYSUTCDATETIME(), '2026-07-10T02:03:53.809Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=294);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 296, 'A2269426-F6EB-4107-99D0-9C1F7B335B36', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:34:08.708Z', SYSUTCDATETIME(), '2026-07-10T02:34:08.947Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=296);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 298, 'D17DDDBF-18CA-4F52-B2B6-AB7E061D6CD2', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:34:23.632Z', SYSUTCDATETIME(), '2026-07-10T02:34:23.849Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=298);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 300, 'BCE6CE91-FC20-469B-9FAD-CBB7503F59CA', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:34:38.465Z', SYSUTCDATETIME(), '2026-07-10T02:34:38.671Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=300);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 302, '5D00C6C2-5166-42B0-AB7E-CCF40A846F3D', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:34:53.382Z', SYSUTCDATETIME(), '2026-07-10T02:34:53.591Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=302);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 304, 'A14BFD86-D92E-4755-8A48-44885A8C08C4', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:35:08.765Z', SYSUTCDATETIME(), '2026-07-10T02:35:08.989Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=304);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 306, '6D591F7D-0EFA-46DF-85DA-222F90A3527B', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:35:23.271Z', SYSUTCDATETIME(), '2026-07-10T02:35:23.543Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=306);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 308, '9DFB9946-7349-4578-AB2A-1C4B2028A2D5', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:35:38.445Z', SYSUTCDATETIME(), '2026-07-10T02:35:38.700Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=308);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 310, '8C382D49-31FA-4C0C-8AB2-E76CC9132982', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:35:53.752Z', SYSUTCDATETIME(), '2026-07-10T02:35:53.971Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=310);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 312, 'CA391254-D81F-4E3A-9B12-ECA2CBCF0D17', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:36:08.665Z', SYSUTCDATETIME(), '2026-07-10T02:36:08.901Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=312);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 314, 'A8173695-2CF4-40DC-A686-ADE5569886BE', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:50:23.710Z', SYSUTCDATETIME(), '2026-07-10T02:50:23.887Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=314);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 316, '39355F6D-00A0-4617-A128-E56B24C4E3D9', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:50:38.662Z', SYSUTCDATETIME(), '2026-07-10T02:50:38.882Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=316);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 318, '5AD3A5FD-3849-4C7D-A243-1C57DDA8066D', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:50:53.500Z', SYSUTCDATETIME(), '2026-07-10T02:50:53.762Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=318);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 320, 'AB1A9857-1FD8-4F94-8042-D620B8448738', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:51:08.409Z', SYSUTCDATETIME(), '2026-07-10T02:51:08.606Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=320);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 322, '10EA4A19-B382-49B2-9FF3-E1C1AA0A0B5C', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:51:23.620Z', SYSUTCDATETIME(), '2026-07-10T02:51:23.807Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=322);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 324, '3C6333CF-4A62-49BD-A769-6B661A758C3D', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:51:38.365Z', SYSUTCDATETIME(), '2026-07-10T02:51:38.569Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=324);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 326, '5B4F2850-2EED-4A96-95BC-D4652FBF8AF4', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:51:53.514Z', SYSUTCDATETIME(), '2026-07-10T02:51:53.730Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=326);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 329, '4A5DED91-71E1-4BF0-8229-1AA13581D9A7', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:52:08.772Z', SYSUTCDATETIME(), '2026-07-10T02:52:10.577Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=329);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 330, 'ACA30117-FE77-4828-9031-7E4AD9A87E14', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T02:52:10.260Z', SYSUTCDATETIME(), '2026-07-10T02:52:22.724Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=330);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 332, 'E079E67D-4617-4CE6-9C3F-C95236EC99B3', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:03:53.784Z', SYSUTCDATETIME(), '2026-07-10T03:03:54.029Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=332);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 334, '9ADF7BB4-2F84-4B3F-878F-9829C90B0BA4', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:04:08.846Z', SYSUTCDATETIME(), '2026-07-10T03:04:09.137Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=334);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 336, 'D8E93B73-076B-4DEF-BD25-BBF0180D0496', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:04:23.639Z', SYSUTCDATETIME(), '2026-07-10T03:04:23.807Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=336);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 338, '7193ACD4-9268-42BB-B5BB-768DB90FB405', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:04:38.519Z', SYSUTCDATETIME(), '2026-07-10T03:04:38.728Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=338);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 340, 'EDB40906-E8D1-4BED-9352-86C0B40F7DB4', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:04:53.646Z', SYSUTCDATETIME(), '2026-07-10T03:04:53.853Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=340);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 342, '00E2CCDB-44B3-4326-872C-E22896400D19', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:05:08.659Z', SYSUTCDATETIME(), '2026-07-10T03:05:08.915Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=342);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 344, 'E3E8E034-13BD-4869-8539-01E793B34F24', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:05:23.710Z', SYSUTCDATETIME(), '2026-07-10T03:05:23.910Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=344);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 346, '9B301B5F-9106-4B2D-9FD5-0BB0F18BCCC4', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:05:38.818Z', SYSUTCDATETIME(), '2026-07-10T03:05:39.010Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=346);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 348, 'D18EC674-3897-4396-BF1B-3303467A7335', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:06:53.757Z', SYSUTCDATETIME(), '2026-07-10T03:06:53.928Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=348);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 350, '8C6C9FC7-56A2-43CB-A81C-19CDAAF5E17F', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:07:08.699Z', SYSUTCDATETIME(), '2026-07-10T03:07:08.912Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=350);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 352, '921E9767-F454-485F-B5D6-0BFED4705BB1', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:07:23.625Z', SYSUTCDATETIME(), '2026-07-10T03:07:23.787Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=352);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 354, '3806A850-FD7A-4471-852C-15B5F299FB11', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:07:38.503Z', SYSUTCDATETIME(), '2026-07-10T03:07:38.649Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=354);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 356, '19A0B756-DAD5-42ED-9506-0F834295B8EC', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:07:53.623Z', SYSUTCDATETIME(), '2026-07-10T03:07:53.842Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=356);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 358, '2645F7C6-3A97-4F2F-99B2-7754BBDCEF05', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:08:08.424Z', SYSUTCDATETIME(), '2026-07-10T03:08:08.694Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=358);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 360, 'B2C690D9-B5DF-4ADD-BE7D-300BED6D18FB', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:08:23.619Z', SYSUTCDATETIME(), '2026-07-10T03:08:23.812Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=360);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 362, '0CC76823-349F-48AD-A9C6-64222A09BEF2', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:08:38.841Z', SYSUTCDATETIME(), '2026-07-10T03:08:39.034Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=362);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 364, '86E9A649-4BAD-4BBF-BBB8-0AD9346D8076', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:08:53.724Z', SYSUTCDATETIME(), '2026-07-10T03:08:53.963Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=364);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 366, '93670CEB-86CC-4791-A576-CA6B195D9D96', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:15:38.888Z', SYSUTCDATETIME(), '2026-07-10T03:15:39.079Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=366);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 368, '3DACBFAD-C26C-4F30-BAF3-C83927DFB940', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:15:53.767Z', SYSUTCDATETIME(), '2026-07-10T03:15:53.957Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=368);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 370, 'B7478CC2-7669-4C1F-BA2A-62125B533A1E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:16:08.702Z', SYSUTCDATETIME(), '2026-07-10T03:16:08.967Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=370);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 372, '918FDD43-4D11-46F5-9C09-01963944FBD6', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:16:23.666Z', SYSUTCDATETIME(), '2026-07-10T03:16:23.913Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=372);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 374, '8C725240-9A4D-42EC-BF36-6F684DA8B37D', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:16:38.798Z', SYSUTCDATETIME(), '2026-07-10T03:16:39.106Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=374);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 376, '3C251121-8073-406A-9498-0A0396B19A4B', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:16:53.401Z', SYSUTCDATETIME(), '2026-07-10T03:16:53.684Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=376);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 378, '6DABA4BE-67D2-42EF-8CEE-EB38560100CD', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:17:08.697Z', SYSUTCDATETIME(), '2026-07-10T03:17:08.997Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=378);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 380, 'C7097613-A4E4-4E5F-8932-931D03696078', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:17:23.895Z', SYSUTCDATETIME(), '2026-07-10T03:17:24.133Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=380);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 382, '5543DA08-4783-4D09-9E35-1E1F7D3B1363', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T03:17:38.746Z', SYSUTCDATETIME(), '2026-07-10T03:17:38.973Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=382);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 384, 'CDA9813C-31A4-48C2-A246-552C510036CF', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T06:35:10.017Z', SYSUTCDATETIME(), '2026-07-10T06:35:10.376Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=384);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 386, '5E3F6AED-F4B6-4742-9C9D-016E65E98D01', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T06:35:24.621Z', SYSUTCDATETIME(), '2026-07-10T06:35:24.926Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=386);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 388, 'DCE267ED-CDAD-43B4-BA6B-70E14D6058AE', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T06:35:39.410Z', SYSUTCDATETIME(), '2026-07-10T06:35:39.694Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=388);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 390, '0CD91082-9A4C-4D76-A15C-9C13539BAB32', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T06:35:54.460Z', SYSUTCDATETIME(), '2026-07-10T06:35:54.871Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=390);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 392, '6FA24028-633C-4351-A3FC-0391FC38D13C', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T06:36:09.819Z', SYSUTCDATETIME(), '2026-07-10T06:36:10.104Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=392);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 394, '64CD1475-5A2C-4312-ABAB-F44C626478E9', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T06:36:24.176Z', SYSUTCDATETIME(), '2026-07-10T06:36:24.386Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=394);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 396, '16AE3492-0BCC-45A7-8B83-D50BA32ECE27', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T06:36:39.355Z', SYSUTCDATETIME(), '2026-07-10T06:36:39.608Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=396);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 398, '5017A79D-F617-4A08-9EDC-6112E81D3DBF', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-10T06:36:54.483Z', SYSUTCDATETIME(), '2026-07-10T06:36:54.720Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=398);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 399, 'DA4680B0-2C88-43A7-BD4B-64C0F1317B9E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:22:29.488Z', SYSUTCDATETIME(), '2026-07-15T07:28:03.748Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=399);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 402, '564A3F5F-A069-41DA-A365-1650AF407679', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:43:05.054Z', SYSUTCDATETIME(), '2026-07-15T07:43:05.330Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=402);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 404, 'FA37D07E-691F-483A-AD55-11E0943FC6B4', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:43:19.772Z', SYSUTCDATETIME(), '2026-07-15T07:43:19.930Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=404);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 406, '239E58E9-B8C3-4F6D-B23C-135A1995A26C', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:43:34.562Z', SYSUTCDATETIME(), '2026-07-15T07:43:34.727Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=406);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 408, '4F7201E0-E1AC-4602-BDD0-E28F76E91688', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:43:49.471Z', SYSUTCDATETIME(), '2026-07-15T07:43:49.663Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=408);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 410, 'CA0A878E-047C-4164-8A93-D10023FB1E22', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:44:04.563Z', SYSUTCDATETIME(), '2026-07-15T07:44:04.723Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=410);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 411, 'F6481C0F-AC65-4267-B5C3-7ACE723E5D18', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:44:06.029Z', SYSUTCDATETIME(), '2026-07-15T07:44:07.648Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=411);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 413, 'B6FCB543-4AA5-4A12-B8F9-66F3D0C33233', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:44:34.627Z', SYSUTCDATETIME(), '2026-07-15T07:44:34.791Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=413);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 415, '9245CAFE-0973-4957-B4D1-7F974B4C1541', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:44:49.743Z', SYSUTCDATETIME(), '2026-07-15T07:44:49.884Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=415);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 417, 'A538FD67-C899-402F-94A0-D2A4DB15C65D', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:45:04.653Z', SYSUTCDATETIME(), '2026-07-15T07:45:04.847Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=417);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 419, '7A046916-3BAB-42E7-B4A3-EE1D44CC5B1E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:45:19.768Z', SYSUTCDATETIME(), '2026-07-15T07:45:19.942Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=419);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 421, '414D1164-BB8B-4163-9113-CA7200B62E86', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:54:34.884Z', SYSUTCDATETIME(), '2026-07-15T07:54:35.062Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=421);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 423, '074767CF-7D2B-4AA5-B029-F15522B4167C', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:57:34.787Z', SYSUTCDATETIME(), '2026-07-15T07:57:34.920Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=423);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 425, '92AD9042-E1D0-488E-9BCD-3A669B74BFC2', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:57:50.174Z', SYSUTCDATETIME(), '2026-07-15T07:57:50.364Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=425);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 427, 'F57DE099-A805-4D19-B4EB-EB24DFAE957A', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:58:06.071Z', SYSUTCDATETIME(), '2026-07-15T07:58:06.259Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=427);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 429, 'F9190827-8F0D-49D5-991C-F90E81153750', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:58:21.153Z', SYSUTCDATETIME(), '2026-07-15T07:58:21.365Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=429);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 431, '6AD2B443-9000-4266-9EA8-5D232E3D4615', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:58:34.648Z', SYSUTCDATETIME(), '2026-07-15T07:58:34.852Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=431);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 433, 'DE15747E-D4A6-4681-A9F9-A23467DECED3', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:58:50.051Z', SYSUTCDATETIME(), '2026-07-15T07:58:50.279Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=433);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 435, '57610398-3862-41F1-844E-8BAB34D5618A', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:59:04.600Z', SYSUTCDATETIME(), '2026-07-15T07:59:04.798Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=435);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 437, 'A0929677-D426-4F52-966C-18D9E1C1ADE3', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:59:19.829Z', SYSUTCDATETIME(), '2026-07-15T07:59:19.991Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=437);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 439, 'F277CEE4-D9D3-4A68-A39D-A91E18C2EB46', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T07:59:34.823Z', SYSUTCDATETIME(), '2026-07-15T07:59:35.052Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=439);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 441, 'F04BEFFD-CA75-4616-B903-13476C159807', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T08:13:19.944Z', SYSUTCDATETIME(), '2026-07-15T08:13:20.114Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=441);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 443, '36C06003-3701-4F34-AE44-BB49016C66B6', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T08:13:35.260Z', SYSUTCDATETIME(), '2026-07-15T08:13:35.425Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=443);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 444, 'F762941E-7926-4819-A37A-144B1FA2950E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T08:13:36.345Z', SYSUTCDATETIME(), '2026-07-15T08:13:37.814Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=444);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 446, '619A1D6F-832C-4793-96C2-756308ADFD2F', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T08:18:35.261Z', SYSUTCDATETIME(), '2026-07-15T08:18:35.476Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=446);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 448, 'A91FE010-AAE3-40DC-8777-51D04E8F4B4B', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T08:18:49.670Z', SYSUTCDATETIME(), '2026-07-15T08:18:49.848Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=448);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 450, '78B4EEEB-21E7-405F-9E12-97BA32C3F49E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T08:19:04.831Z', SYSUTCDATETIME(), '2026-07-15T08:19:05.004Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=450);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 452, 'FE801408-569E-472A-B484-3A440BB08C13', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-15T08:19:19.902Z', SYSUTCDATETIME(), '2026-07-15T08:19:20.036Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=452);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 454, '7B94CAD8-786C-472A-8FF2-A9285B69FE55', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T06:48:23.643Z', SYSUTCDATETIME(), '2026-07-16T06:48:23.799Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=454);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 456, 'EB1EEB69-87FA-4CF6-843E-C636286A425E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T06:50:38.978Z', SYSUTCDATETIME(), '2026-07-16T06:50:39.116Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=456);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 458, '0059EF1F-1657-437E-971B-064037B4381F', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T06:53:39.128Z', SYSUTCDATETIME(), '2026-07-16T06:53:39.280Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=458);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 460, 'F67E5692-A79E-4E3B-AFA5-4BF4725812DF', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T07:01:23.626Z', SYSUTCDATETIME(), '2026-07-16T07:01:23.790Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=460);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 462, 'A76C46C3-FE93-4F09-933E-50B5E4D3B2F6', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T07:04:08.700Z', SYSUTCDATETIME(), '2026-07-16T07:04:08.851Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=462);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 464, '467F9729-A8C8-444C-87BC-24DC7D5BFBED', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T07:04:53.698Z', SYSUTCDATETIME(), '2026-07-16T07:04:53.850Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=464);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 466, 'B6670957-75A7-48EE-ABCD-6D5C338BDF1A', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T07:07:22.710Z', SYSUTCDATETIME(), '2026-07-16T07:07:22.978Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=466);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 468, '2278231D-39EA-4698-AE13-C306D4A29E6C', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T07:08:07.686Z', SYSUTCDATETIME(), '2026-07-16T07:08:07.823Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=468);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 470, '3A741F6F-0C54-4AA4-B30D-D87313606F46', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T07:11:09.235Z', SYSUTCDATETIME(), '2026-07-16T07:11:09.398Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=470);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 472, 'D14E99D5-A4C0-463F-A860-85783EDD55DC', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T07:14:09.361Z', SYSUTCDATETIME(), '2026-07-16T07:14:09.527Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=472);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 474, 'F2BF5945-1316-421E-AD9A-B6BAA2AFC4B5', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T07:21:39.131Z', SYSUTCDATETIME(), '2026-07-16T07:21:39.277Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=474);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 476, '5A963BBA-4539-444B-BD9B-0491B066E340', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T08:15:39.269Z', SYSUTCDATETIME(), '2026-07-16T08:15:39.407Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=476);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 478, '445D3675-C6B9-4E71-990D-A23200130887', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T08:35:00.504Z', SYSUTCDATETIME(), '2026-07-16T08:35:00.833Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=478);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 480, 'DA325FE2-C1AA-44F2-9EC5-C339F39CD26B', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T08:40:44.420Z', SYSUTCDATETIME(), '2026-07-16T08:40:44.605Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=480);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 482, '1FC9475F-9057-4B1A-8FE3-5AD2F2F5ADD9', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T08:55:29.925Z', SYSUTCDATETIME(), '2026-07-16T08:55:30.103Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=482);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 484, 'C7546215-9D0F-477A-B544-8FA0F8ABFC37', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T20:11:43.449Z', SYSUTCDATETIME(), '2026-07-16T20:11:43.601Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=484);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 486, '052F5EF8-7F86-47D6-9984-1BC24461AD78', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T20:14:43.514Z', SYSUTCDATETIME(), '2026-07-16T20:14:43.721Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=486);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 488, 'E17EB848-B75F-43EA-809C-EF167DA65131', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T21:33:40.353Z', SYSUTCDATETIME(), '2026-07-16T21:33:40.499Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=488);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 490, 'BEF61650-78C7-4624-AD31-2F1FA31FD641', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T21:33:55.264Z', SYSUTCDATETIME(), '2026-07-16T21:33:55.427Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=490);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 492, '64572E85-EA08-4666-8D49-DC0452753557', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T21:34:54.971Z', SYSUTCDATETIME(), '2026-07-16T21:34:55.104Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=492);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 494, '903C9B1F-3B02-49D6-B954-B0F2A44E8AFA', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T21:37:40.012Z', SYSUTCDATETIME(), '2026-07-16T21:37:40.230Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=494);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 496, 'C227A127-DE3A-4325-AE46-8F8F4373B316', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T22:12:10.791Z', SYSUTCDATETIME(), '2026-07-16T22:12:10.941Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=496);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 498, 'F83743D1-D817-44A6-9F49-CDBFDE1FE938', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T22:24:40.876Z', SYSUTCDATETIME(), '2026-07-16T22:24:41.013Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=498);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 500, 'D88C8EBE-2FE3-48C5-8AFE-953D61B97B99', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-16T22:27:40.396Z', SYSUTCDATETIME(), '2026-07-16T22:27:40.537Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=500);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 502, '818BA3CC-2ED0-4470-A6E2-3E6C03CEE8AD', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-17T20:24:59.194Z', SYSUTCDATETIME(), '2026-07-17T20:24:59.352Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=502);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 504, 'A0F8EF23-6D8E-40AE-864D-6DDDD923EFEB', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-18T18:23:17.951Z', SYSUTCDATETIME(), '2026-07-18T18:23:18.211Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=504);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 506, '6E3ECF3A-9416-4020-B231-70BAF1EB9662', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-18T18:54:02.505Z', SYSUTCDATETIME(), '2026-07-18T18:54:02.722Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=506);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 508, '145BDA84-7792-4322-8848-890F359BA5F8', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-18T19:06:47.396Z', SYSUTCDATETIME(), '2026-07-18T19:06:47.637Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=508);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 510, '084B8E6E-3CBE-4540-9424-24430F019180', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-18T19:07:03.064Z', SYSUTCDATETIME(), '2026-07-18T19:07:03.315Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=510);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 512, 'D36F6C6C-321E-4D51-B157-A21E00B594A3', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-18T19:07:18.716Z', SYSUTCDATETIME(), '2026-07-18T19:07:18.963Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=512);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 514, '1BAA844F-08C2-4601-93F0-0D32DF7EC0CC', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T01:37:04.150Z', SYSUTCDATETIME(), '2026-07-19T01:37:04.349Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=514);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 516, '862AE83F-ED0B-47F8-882C-F114ABB9571B', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T01:37:19.037Z', SYSUTCDATETIME(), '2026-07-19T01:37:19.171Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=516);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 518, '477B0C8A-ACA8-413C-9702-994D3804B7FF', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T01:37:34.135Z', SYSUTCDATETIME(), '2026-07-19T01:37:34.308Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=518);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 520, 'DC87A4EE-A1F9-4FE2-AC6B-D44174C3F085', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T01:37:48.112Z', SYSUTCDATETIME(), '2026-07-19T01:37:48.249Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=520);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 522, 'EE8FF02C-ACC7-4C81-BBCC-A41037FBA08D', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T01:41:48.542Z', SYSUTCDATETIME(), '2026-07-19T01:41:48.662Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=522);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 524, '9B27E4DE-65B1-4FB4-A4E0-F9B9B244CF0F', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T01:42:03.700Z', SYSUTCDATETIME(), '2026-07-19T01:42:03.867Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=524);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 526, '643BDD62-5B68-4F80-A61C-99530ADA72A1', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T02:01:04.853Z', SYSUTCDATETIME(), '2026-07-19T02:01:05.146Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=526);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 528, '9636BF02-79DD-47EB-8DA1-3DE9D40A05F1', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T02:20:34.534Z', SYSUTCDATETIME(), '2026-07-19T02:20:34.718Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=528);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 530, 'FA212D98-8AD3-4A73-AE8B-1C27CD1607AB', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T02:20:48.420Z', SYSUTCDATETIME(), '2026-07-19T02:20:48.527Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=530);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 532, 'E9F7CA4C-56AB-420E-86F7-73884CF6EEF2', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T02:21:03.413Z', SYSUTCDATETIME(), '2026-07-19T02:21:03.560Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=532);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 534, 'EE8B6B42-34CF-49B3-8123-872388FD7345', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T02:21:18.938Z', SYSUTCDATETIME(), '2026-07-19T02:21:19.168Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=534);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 536, 'E8D4FF7A-B43E-40BC-9A6E-7F812D6780B6', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-19T23:59:22.054Z', SYSUTCDATETIME(), '2026-07-19T23:59:22.202Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=536);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 538, 'CC3ABF5B-4F94-4DAD-9484-B99939E41E37', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:01:07.049Z', SYSUTCDATETIME(), '2026-07-20T00:01:07.277Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=538);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 540, '653DBB3B-8497-4B7C-A05A-3586472BDCA2', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:04:53.430Z', SYSUTCDATETIME(), '2026-07-20T00:04:53.609Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=540);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 542, '1E33F11C-7D3E-41AF-BFB8-85A4AB9FA6AA', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:05:08.322Z', SYSUTCDATETIME(), '2026-07-20T00:05:08.589Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=542);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 544, '2AF0A0C3-A9A7-4521-9CD4-E0AC78A9A5C6', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:05:22.672Z', SYSUTCDATETIME(), '2026-07-20T00:05:22.806Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=544);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 546, '8DD15FAD-07DD-4037-A235-6CC2925C3338', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:05:37.684Z', SYSUTCDATETIME(), '2026-07-20T00:05:37.838Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=546);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 548, '2E556041-DEBD-4434-B046-D6491ABF7108', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:05:52.783Z', SYSUTCDATETIME(), '2026-07-20T00:05:53.003Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=548);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 550, 'D2F12D90-38C0-439F-A959-91894D232CED', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:06:07.584Z', SYSUTCDATETIME(), '2026-07-20T00:06:07.734Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=550);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 552, 'F364B111-E763-4185-8616-0325C9CCC83E', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:06:22.887Z', SYSUTCDATETIME(), '2026-07-20T00:06:23.046Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=552);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 554, '87EC7CA0-5EFD-47A6-8F36-E206414937FE', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:12:22.598Z', SYSUTCDATETIME(), '2026-07-20T00:12:22.776Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=554);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 556, 'C423FADE-BA7C-4B14-B737-3139D760D8C4', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:12:37.235Z', SYSUTCDATETIME(), '2026-07-20T00:12:37.419Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=556);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 558, 'E12BDF1A-7631-4216-99E0-7E98E3F636AD', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:24:22.371Z', SYSUTCDATETIME(), '2026-07-20T00:24:22.517Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=558);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 560, 'FE217358-4CDF-491B-A1E6-E12AEA476A5D', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T00:24:37.364Z', SYSUTCDATETIME(), '2026-07-20T00:24:37.537Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=560);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 562, 'BF532D49-0E21-4696-A95C-9BC58603060B', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T03:47:06.069Z', SYSUTCDATETIME(), '2026-07-20T03:47:06.235Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=562);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 564, 'F78A1361-6F09-4A70-B407-6B11BF6F053C', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T04:35:45.506Z', SYSUTCDATETIME(), '2026-07-20T04:35:45.702Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=564);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 566, '9858AD9E-9EB1-4D61-866B-1BCF890F8635', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T04:42:24.027Z', SYSUTCDATETIME(), '2026-07-20T04:42:24.205Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=566);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 568, '84CE23E5-E956-4A3F-8356-6944E98C89CB', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T04:42:38.978Z', SYSUTCDATETIME(), '2026-07-20T04:42:39.205Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=568);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 570, 'C3406966-5332-4F76-9FF5-682F2ED3F325', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T04:42:54.033Z', SYSUTCDATETIME(), '2026-07-20T04:42:54.222Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=570);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 572, 'DD9E41B0-2976-4DE2-BA2F-1023D8120F73', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T04:43:09.040Z', SYSUTCDATETIME(), '2026-07-20T04:43:09.214Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=572);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 574, '8C6C28E3-6F7C-4923-83CF-9008407DC821', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T04:43:23.854Z', SYSUTCDATETIME(), '2026-07-20T04:43:24.121Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=574);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 576, 'B96F2A6B-B426-4937-931F-CE49F13F02A5', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T04:43:38.851Z', SYSUTCDATETIME(), '2026-07-20T04:43:39.028Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=576);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 578, 'AA9D286F-A83F-4305-91A1-9B349F6D06DC', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T04:43:53.441Z', SYSUTCDATETIME(), '2026-07-20T04:43:53.644Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=578);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 580, 'A04D01C2-362C-4546-A09F-18D2CEA946ED', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T04:44:08.524Z', SYSUTCDATETIME(), '2026-07-20T04:44:08.712Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=580);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 582, '16AEACFF-90D1-4124-9866-A62B64C42A3F', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T04:44:23.949Z', SYSUTCDATETIME(), '2026-07-20T04:44:24.124Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=582);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 584, 'A5F57ABD-C0A8-45C7-A8E6-133F6A26A2F5', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T14:23:26.452Z', SYSUTCDATETIME(), '2026-07-20T14:23:26.647Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=584);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 586, '0C42D442-18E5-4E1C-AE6A-37035F7C2D64', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T14:53:24.982Z', SYSUTCDATETIME(), '2026-07-20T14:53:25.365Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=586);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 588, 'C3A642BC-D1F7-4A68-8B42-E752DE870AB8', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T14:56:24.910Z', SYSUTCDATETIME(), '2026-07-20T14:56:25.093Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=588);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 590, '84F80C18-A998-4493-B701-1C5EFB2B94CF', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-20T15:00:09.747Z', SYSUTCDATETIME(), '2026-07-20T15:00:09.949Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=590);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 592, 'FD83D694-6C4A-4021-A964-5C1408855DD1', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-07-21T01:59:41.829Z', SYSUTCDATETIME(), '2026-07-21T01:59:41.971Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=592);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 593, 'F3AF362D-B4F5-4C03-A519-350DFB16E4B1', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-08-10T16:46:16.178Z', SYSUTCDATETIME(), '2026-08-10T16:46:18.147Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=593);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 594, 'BB9A8D4A-F4A2-4BE2-A296-6871A0DA449C', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-08-10T16:47:40.482Z', SYSUTCDATETIME(), '2026-08-10T16:47:48.136Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=594);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 596, '4B654676-BD91-475B-B782-0372E0C22237', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-02T19:10:07.845Z', SYSUTCDATETIME(), '2026-10-02T19:10:08.469Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=596);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 598, 'F7E81C02-87C0-412A-8CE7-DAAE1445E99D', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-02T19:22:38.971Z', SYSUTCDATETIME(), '2026-10-02T19:22:39.177Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=598);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 599, 'EC41BC56-FB4C-4BC8-8033-FADD0EE5B88A', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-03T08:28:58.854Z', SYSUTCDATETIME(), '2026-10-03T08:29:06.800Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=599);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 601, 'E4C3371C-8827-4CAC-AC49-6F44589628C0', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-03T08:30:07.101Z', SYSUTCDATETIME(), '2026-10-03T08:30:07.336Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=601);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 603, '08DFF8E2-7275-49ED-9BD2-D8CB22547B85', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-10T06:12:51.021Z', SYSUTCDATETIME(), '2026-10-10T06:12:51.209Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=603);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 605, 'B3E52EB0-6C81-40E0-8848-ABA9F543C037', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-10T06:14:08.731Z', SYSUTCDATETIME(), '2026-10-10T06:14:08.873Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=605);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 607, 'BFA26BC9-3ECE-4D29-9361-919657757151', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-10T16:47:51.933Z', SYSUTCDATETIME(), '2026-10-10T16:47:52.068Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=607);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 609, '62E5D4E6-F89C-4C8F-ADE6-C26257FA6AF6', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-10T16:48:06.977Z', SYSUTCDATETIME(), '2026-10-10T16:48:07.148Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=609);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 611, 'A2524B79-A054-46F3-8349-0FEFFAE3E301', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-10T16:48:21.759Z', SYSUTCDATETIME(), '2026-10-10T16:48:21.929Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=611);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 613, '11A23CE2-9077-4379-B028-8FB68DF3ADD6', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-10T16:48:37.144Z', SYSUTCDATETIME(), '2026-10-10T16:48:37.282Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=613);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 615, '49562F45-7073-47BF-8240-8AD710E44DC0', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-10T17:04:36.487Z', SYSUTCDATETIME(), '2026-10-10T17:04:36.632Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=615);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 908, 'FEDF252B-A797-4C79-9B00-D14E43322DEF', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-10T17:31:37.959Z', SYSUTCDATETIME(), '2026-10-10T17:31:41.035Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=908);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 1203, '1F47C9DF-FF1D-4866-BDC5-D6E318A642A3', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-10T17:56:05.448Z', SYSUTCDATETIME(), '2026-10-10T17:56:11.469Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=1203);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 1206, '9F83344A-3090-4357-A8E9-D727780DA2E5', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-10T17:56:14.173Z', SYSUTCDATETIME(), '2026-10-10T17:56:26.249Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=1206);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 1227, '1F47C9DF-FF1D-4866-BDC5-D6E318A642A3', N'full_pipeline', N'failed', 100, 1, 3, N'PROCESSING_ERROR', NULL, '2026-10-10T17:57:57.326Z', SYSUTCDATETIME(), '2026-10-10T17:58:11.549Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=1227);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 126423, '5EC451CE-EAFC-4E36-8612-2BE325781155', N'full_pipeline', N'failed', 100, 1, 3, N'UNSUPPORTED_MEDIA', NULL, '2026-10-31T06:35:01.622Z', SYSUTCDATETIME(), '2026-10-31T06:35:08.306Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=126423);
INSERT INTO me.processing_job (job_id, media_id, job_type, status, priority, attempts, max_attempts, error_code, error_message, created_at, updated_at, finished_at, channel, post_id, sponsor_id, user_id)
SELECT 126424, '5EC451CE-EAFC-4E36-8612-2BE325781155', N'full_pipeline', N'failed', 100, 1, 1, N'UNSUPPORTED_MEDIA', NULL, '2026-10-31T06:50:26.920Z', SYSUTCDATETIME(), '2026-10-31T06:50:31.440Z', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM me.processing_job WHERE job_id=126424);
COMMIT TRANSACTION;
