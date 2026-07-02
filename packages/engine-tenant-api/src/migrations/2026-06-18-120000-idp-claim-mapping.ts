import { MigrationBuilder } from '@contember/database-migrations'

// A09 — IdP claim mapping. The mapping itself rides inside the existing
// `identity_provider.configuration` JSONB (`configuration.claimMapping`), so no table or column
// change is needed. This migration only wires the call sites: the new `idp_role_mapped` audit
// action emitted when claim-mapping (re)syncs project memberships, and `idp_role_mapping_failed`
// emitted when a configured mapping failed and was skipped (fail-open).
const sql = `
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'idp_role_mapped';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'idp_role_mapping_failed';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
