import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'api_key_create';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'api_key_disable';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'idp_create';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'idp_update';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'idp_disable';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'idp_enable';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'project_create';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'project_update';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'project_secret_change';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'mail_template_change';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'tenant_config_change';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'person_invite';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
