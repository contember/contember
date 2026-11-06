import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE config
	ADD COLUMN login_mfa_change_require_reauthentication BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
