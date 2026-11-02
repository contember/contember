import { MigrationBuilder } from '@contember/database-migrations'

// Own migration: a new enum value cannot be used in the transaction that adds it.
const sql = `
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'workload_auth_success';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'workload_auth_failure';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'workload_identity_apply';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'workload_identity_disable';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
