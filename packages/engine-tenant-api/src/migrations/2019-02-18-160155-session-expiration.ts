import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "api_key"
	ADD COLUMN expiration INT DEFAULT NULL;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
