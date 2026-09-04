import { MigrationBuilder } from '@contember/database-migrations'

// New enum values are added in their own migration so the values are committed
// before any later migration (or runtime code) inserts rows using them — a new
// enum value cannot be used in the same transaction that adds it.
//
// A32 — emitted when the hygiene sweep removes a claim-granted membership whose
// lease was never renewed, so a grant lapsing is as visible in the audit log as
// the `idp_role_mapped` change that created it.
const sql = `
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'idp_membership_lease_expired';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
