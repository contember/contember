import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE person
	ADD disabled_at TIMESTAMP WITH TIME ZONE;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
