import { MigrationBuilder } from '@contember/database-migrations'

// Existing templates keep being sent as before; every later write sets the flag from its writer's roles.
const sql = `
ALTER TABLE mail_template
	ADD COLUMN trusted BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE mail_template
	ALTER COLUMN trusted SET DEFAULT FALSE;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
