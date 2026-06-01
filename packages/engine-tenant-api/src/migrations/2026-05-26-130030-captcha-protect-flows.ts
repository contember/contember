import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
-- Per-flow captcha enforcement. A single captcha provider/secret is shared, but
-- which mutations actually require a captcha token is now configurable instead
-- of an all-or-nothing global switch (different deployments expose different
-- subsets publicly — e.g. open registration vs admin-only signUp).
--
-- The historically-protected flows default to TRUE so configuring a provider
-- keeps protecting them exactly as before. requestEmailVerification is a
-- newly-added gate (never shipped enforced), so it defaults to FALSE — opt in
-- explicitly if that resend endpoint is publicly exposed.
ALTER TABLE "config"
	ADD COLUMN "captcha_protect_sign_up"           BOOLEAN NOT NULL DEFAULT TRUE,
	ADD COLUMN "captcha_protect_password_reset"     BOOLEAN NOT NULL DEFAULT TRUE,
	ADD COLUMN "captcha_protect_passwordless_init"  BOOLEAN NOT NULL DEFAULT TRUE,
	ADD COLUMN "captcha_protect_email_verification" BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
