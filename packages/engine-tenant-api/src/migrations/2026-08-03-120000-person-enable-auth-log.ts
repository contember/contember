import { MigrationBuilder } from '@contember/database-migrations'

// New enum values are added in their own migration so the values are committed
// before any later migration (or runtime code) inserts rows using them — a new
// enum value cannot be used in the same transaction that adds it.
const sql = `
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'person_enable';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
