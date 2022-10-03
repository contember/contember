import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE person ALTER COLUMN password_hash DROP NOT NULL;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}

