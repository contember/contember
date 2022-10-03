import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE person
	ADD UNIQUE (identity_id);
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
