import { MigrationBuilder } from '@contember/database-migrations'

// New enum values are added in their own migration so the values are committed
// before any later migration (or runtime code) inserts rows using them — a new
// enum value cannot be used in the same transaction that adds it.
const sql = `
ALTER TYPE "person_token_type" ADD VALUE IF NOT EXISTS 'email_verification';
ALTER TYPE "person_token_type" ADD VALUE IF NOT EXISTS 'email_change';

ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'email_verify_init';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'email_verify_complete';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'email_change_init';
ALTER TYPE auth_log_type ADD VALUE IF NOT EXISTS 'email_change_complete';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
