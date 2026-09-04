import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "project_membership"
	-- A32: when the IdP claim mapping that granted this membership must confirm it again. NULL = no
	-- lease, i.e. the membership stands until something removes it — every pre-A32 row, every
	-- operator-managed row, and every grant from a mapping with no 'membershipLease' configured. A row
	-- whose lease has lapsed grants nothing (the membership queries filter it out), so the security
	-- property holds whether or not the sweep ever runs.
	ADD COLUMN "lease_expires_at" TIMESTAMPTZ,
	-- Which provider's claim mapping granted and renews the row above: provenance, so an expiry can be
	-- attributed and so a later rule can bind the grant to sessions from that provider. NULL for a
	-- membership no claim mapping is accountable for.
	ADD COLUMN "identity_provider_id" UUID;

-- SET NULL, never CASCADE: removing a provider must not delete a person's membership as a side effect.
-- The row simply loses its grantor, and with nothing left to renew it the lease lapses on its own.
ALTER TABLE "project_membership"
	ADD CONSTRAINT "project_membership_identity_provider"
		FOREIGN KEY ("identity_provider_id") REFERENCES "identity_provider"("id") ON DELETE SET NULL;

-- Partial: only leased rows are ever looked up by expiry, and in a deployment that configures no lease
-- the index stays empty, so the membership hot path pays nothing for a feature it does not use.
CREATE INDEX "project_membership_lease_expires_at"
	ON "project_membership" ("lease_expires_at")
	WHERE "lease_expires_at" IS NOT NULL;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
