import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "person"
	-- Timestamp the email was proven owned; NULL = not verified. Existing
	-- accounts stay NULL (no backfill) but are NOT locked out — see the
	-- per-person flag below.
	ADD COLUMN "email_verified_at" TIMESTAMPTZ,
	-- Captured at sign-up from config.signup_require_email_verification. Flipping
	-- the tenant-wide flag must only affect NEW accounts, so the requirement is
	-- frozen per person here rather than read live at sign-in. Existing accounts
	-- default to FALSE and therefore keep signing in regardless of the flag.
	ADD COLUMN "email_verification_required" BOOLEAN NOT NULL DEFAULT FALSE;

-- Generic per-token payload. Used by email_change tokens to carry the pending
-- new address until the token is confirmed; NULL for all other token types.
ALTER TABLE "person_token"
	ADD COLUMN "meta" JSONB;

-- Opt-in: disabled by default so upgrading the engine alone does not start
-- requiring verification for existing deployments.
ALTER TABLE "config"
	ADD COLUMN "signup_require_email_verification" BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
