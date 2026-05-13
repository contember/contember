import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'global_role_grant';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'global_role_revoke';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'project_membership_create';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'project_membership_update';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'project_membership_remove';

ALTER TABLE person_auth_log
	ADD COLUMN target_person_id UUID REFERENCES person(id) ON DELETE SET NULL,
	ADD COLUMN change_diff JSONB;

CREATE INDEX ON person_auth_log (target_person_id, created_at DESC)
	WHERE target_person_id IS NOT NULL;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
