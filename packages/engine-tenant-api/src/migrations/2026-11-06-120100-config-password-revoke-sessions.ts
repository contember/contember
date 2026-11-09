import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE config
	ADD COLUMN password_revoke_sessions_on_change BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
