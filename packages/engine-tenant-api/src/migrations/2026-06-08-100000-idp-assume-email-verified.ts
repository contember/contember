import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
-- When TRUE, e-mail addresses asserted by this identity provider are treated as
-- verified even if the provider does not send an "email_verified" claim. Use only
-- for trusted providers (e.g. an enterprise IdP that vouches for its accounts) so
-- that "require_verified_email" can stay on without the IdP emitting the claim.
-- Defaults to FALSE to preserve existing behavior.
ALTER TABLE "identity_provider"
	ADD COLUMN "assume_email_verified" BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
