import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'global_role_grant';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'global_role_revoke';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'project_membership_create';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'project_membership_update';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'project_membership_remove';

ALTER TABLE person_auth_log
	ADD COLUMN event_data JSONB;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
