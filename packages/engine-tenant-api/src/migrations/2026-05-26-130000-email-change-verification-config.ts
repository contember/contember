import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
-- Verification of a user-initiated e-mail change is a separate policy from
-- signup verification (config.signup_require_email_verification): an account
-- may not require verification to sign in, yet changing the address of an
-- existing account should still prove ownership of the new address before it
-- replaces the old one. Defaults to FALSE so an engine upgrade does not change
-- existing changeMyProfile behavior — the address keeps swapping immediately.
-- Opt in by setting it to TRUE: changing your own e-mail then goes through
-- confirmEmailChange (the old address stays active until the new one is
-- confirmed).
ALTER TABLE "config"
	ADD COLUMN "require_email_change_verification" BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
