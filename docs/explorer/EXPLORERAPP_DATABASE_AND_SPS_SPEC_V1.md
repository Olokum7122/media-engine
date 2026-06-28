# ExplorerApp Database and Stored Procedures Spec V1

Estado: fuente canonica draft  
DB recomendada: `ATLX_EXPLORER_APP`  
Schema principal: `explorer_core`

## 1. Reglas de DB

- Toda tabla tiene PK.
- Toda relacion tiene FK.
- Toda tabla operacional tiene `status`.
- Toda tabla principal tiene `created_at`.
- Tablas mutables tienen `updated_at`.
- Mutaciones productivas via SP.
- No SQL directo en resolvers para mutaciones nuevas.
- IDs publicos son strings estables.

## 2. Tablas canonicas

### explorer_core.tenants

- `tenant_id` PK
- `tenant_type` personal|team|brand|agency|enterprise
- `display_name`
- `legal_name`
- `status` active|suspended|cancelled|deleted
- `created_at`
- `updated_at`

### explorer_core.instances

- `instance_id` PK
- `tenant_id` FK -> tenants
- `instance_type` explorer_studio|antojados_connected|agency_workspace
- `region`
- `timezone`
- `status`
- `created_at`
- `updated_at`

### explorer_core.users

- `user_id` PK
- `auth_provider`
- `auth_subject`
- `email_hash`
- `display_name`
- `avatar_url`
- `status`
- `created_at`
- `updated_at`

### explorer_core.roles

- `role_id` PK
- `tenant_id` FK nullable
- `role_key` owner|admin|producer|editor|viewer|billing_admin
- `permissions_json`
- `status`
- `created_at`

### explorer_core.tenant_users

- `tenant_user_id` PK
- `tenant_id` FK
- `instance_id` FK
- `user_id` FK
- `role_id` FK
- `status` active|invited|disabled|removed
- `created_at`
- `updated_at`

### explorer_core.locations

- `location_id` PK
- `tenant_id` FK
- `instance_id` FK
- `name`
- `address_text`
- `lat`
- `lng`
- `external_place_ref`
- `status`
- `created_at`
- `updated_at`

### explorer_core.location_rules

- `rule_id` PK
- `tenant_id` FK
- `instance_id` FK
- `location_id` FK
- `rule_type` publish_scope|geo_required|approval_required|destination_allowed
- `rule_json`
- `status`
- `created_at`
- `updated_at`

### explorer_core.plans

- `plan_id` PK
- `plan_key` trial|creator|team|antojados_connected|agency
- `display_name`
- `limits_json`
- `price_ref`
- `status`
- `created_at`

### explorer_core.subscriptions

- `subscription_id` PK
- `tenant_id` FK
- `plan_id` FK
- `billing_provider`
- `billing_ref`
- `status` trialing|active|past_due|suspended|cancelled
- `current_period_start`
- `current_period_end`
- `created_at`
- `updated_at`

### explorer_core.usage_counters

- `usage_counter_id` PK
- `tenant_id` FK
- `instance_id` FK
- `period_key`
- `metric_key` renders|video_minutes|storage_bytes|projects|destinations
- `used_value`
- `limit_value`
- `created_at`
- `updated_at`

### explorer_core.projects

- `project_id` PK
- `tenant_id` FK
- `instance_id` FK
- `owner_user_id` FK
- `location_id` FK nullable
- `title`
- `project_type` photo|video|campaign|antojados_post|export
- `status` draft|editing|rendering|ready|publishing|published|error|archived
- `metadata_json`
- `created_at`
- `updated_at`

### explorer_core.project_assets

- `project_asset_id` PK
- `project_id` FK
- `tenant_id` FK
- `instance_id` FK
- `media_asset_id`
- `role` source|cover|audio|logo|render|thumbnail
- `sort_order`
- `status`
- `created_at`

### explorer_core.project_timelines

- `timeline_id` PK
- `project_id` FK
- `tenant_id` FK
- `instance_id` FK
- `timeline_json`
- `version_no`
- `status`
- `created_at`
- `created_by_user_id`

### explorer_core.connected_destinations

- `destination_id` PK
- `tenant_id` FK
- `instance_id` FK
- `destination_type` antojados|download|external_social
- `display_name`
- `external_ref`
- `credentials_ref`
- `settings_json`
- `status` active|disabled|revoked|deleted
- `created_at`
- `updated_at`

### explorer_core.publications

- `publication_id` PK
- `tenant_id` FK
- `instance_id` FK
- `project_id` FK
- `destination_id` FK
- `destination_type`
- `status` draft|queued|publishing|published|error|cancelled
- `target_json`
- `payload_json`
- `external_post_id`
- `error_message`
- `created_at`
- `published_at`
- `updated_at`

### explorer_core.publication_assets

- `publication_asset_id` PK
- `publication_id` FK
- `render_id`
- `role` primary|gallery|cover|thumbnail
- `sort_order`
- `created_at`

### explorer_core.publication_attempts

- `attempt_id` PK
- `publication_id` FK
- `attempt_no`
- `request_json`
- `response_json`
- `status`
- `created_at`

## 3. Stored procedures canonicos

### Tenant/instance/users

- `explorer_core.usp_tenant_create`
- `explorer_core.usp_tenant_get`
- `explorer_core.usp_instance_create`
- `explorer_core.usp_instance_get`
- `explorer_core.usp_user_upsert_from_auth`
- `explorer_core.usp_tenant_user_attach`
- `explorer_core.usp_tenant_user_set_role`
- `explorer_core.usp_tenant_user_disable`

### Locations/rules

- `explorer_core.usp_location_create`
- `explorer_core.usp_location_update`
- `explorer_core.usp_location_rule_upsert`
- `explorer_core.usp_location_rules_get`

### Billing

- `explorer_core.usp_plan_seed`
- `explorer_core.usp_subscription_sync`
- `explorer_core.usp_usage_counter_increment`
- `explorer_core.usp_usage_limit_check`

### Projects

- `explorer_core.usp_project_create`
- `explorer_core.usp_project_get`
- `explorer_core.usp_project_list`
- `explorer_core.usp_project_update_metadata`
- `explorer_core.usp_project_set_status`
- `explorer_core.usp_project_archive`
- `explorer_core.usp_project_asset_attach`
- `explorer_core.usp_project_asset_detach`
- `explorer_core.usp_project_timeline_save`
- `explorer_core.usp_project_timeline_get_latest`

### Destinations/publications

- `explorer_core.usp_connected_destination_upsert`
- `explorer_core.usp_connected_destination_get`
- `explorer_core.usp_connected_destinations_list`
- `explorer_core.usp_publication_create`
- `explorer_core.usp_publication_asset_attach`
- `explorer_core.usp_publication_queue`
- `explorer_core.usp_publication_mark_publishing`
- `explorer_core.usp_publication_mark_published`
- `explorer_core.usp_publication_mark_error`
- `explorer_core.usp_publication_attempt_register`

## 4. Indices obligatorios

- `tenants(status)`
- `instances(tenant_id,status)`
- `tenant_users(tenant_id,instance_id,user_id,status)`
- `locations(tenant_id,instance_id,status)`
- `projects(tenant_id,instance_id,status,created_at)`
- `project_assets(project_id,sort_order)`
- `connected_destinations(tenant_id,instance_id,destination_type,status)`
- `publications(tenant_id,instance_id,status,created_at)`
- `publication_assets(publication_id,sort_order)`
- `usage_counters(tenant_id,instance_id,period_key,metric_key)`

## 5. Checks/enums

Toda columna tipo enum debe tener check constraint en SQL Server. Los enums publicos deben coincidir con contratos API.

