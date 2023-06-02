import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE person
	ADD disable BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}

