import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE identity_provider
	ADD COLUMN init_returns_config BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
