import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE config ADD COLUMN login_mfa_grace_duration INTERVAL NOT NULL DEFAULT '0';
ALTER TABLE auth_policy ADD COLUMN grace_duration INTERVAL;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
