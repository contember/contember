import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
-- When TRUE, a non-exclusive identity provider may only auto-link to (or sign
-- in) an existing account by e-mail if the provider asserts the e-mail is
-- verified (the OIDC "email_verified" claim). This blocks account takeover via
-- a provider that returns an unverified / attacker-controlled e-mail. Defaults
-- to FALSE to preserve existing behavior; tighten per provider as needed.
ALTER TABLE "identity_provider"
	ADD COLUMN "require_verified_email" BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
