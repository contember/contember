import { MigrationBuilder } from '@contember/database-migrations'

// Own migration: a new enum value cannot be used in the transaction that adds it.
const sql = `
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'sign_out';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
