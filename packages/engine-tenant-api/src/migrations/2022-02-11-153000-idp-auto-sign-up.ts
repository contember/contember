import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE identity_provider
	ADD COLUMN auto_sign_up BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
