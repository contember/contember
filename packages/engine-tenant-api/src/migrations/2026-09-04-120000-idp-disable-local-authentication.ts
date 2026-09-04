import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
-- When TRUE, a person linked to this identity provider may authenticate ONLY through
-- it: password sign-in, passwordless sign-in and password-reset mails are refused for
-- them. The link itself is the marker, so it also covers a person who predates the
-- provider and got linked by e-mail matching.
--
-- Scoped to providers that are currently enabled: disabling the provider restores
-- local authentication for everyone linked to it, which is the break-glass for an IdP
-- outage. Defaults to FALSE to preserve existing behavior.
ALTER TABLE "identity_provider"
	ADD COLUMN "disable_local_authentication" BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
