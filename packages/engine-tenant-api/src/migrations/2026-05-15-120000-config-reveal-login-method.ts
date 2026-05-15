import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE config
	ADD COLUMN login_reveal_login_method BOOLEAN NOT NULL DEFAULT TRUE;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
