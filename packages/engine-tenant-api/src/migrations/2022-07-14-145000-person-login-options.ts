import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE person
	ADD idp_only BOOLEAN NOT NULL DEFAULT FALSE,
	ADD CONSTRAINT idp_only_no_email CHECK ( idp_only = FALSE OR (idp_only = TRUE AND email IS NULL));

ALTER TABLE identity_provider
	ADD exclusive BOOLEAN DEFAULT FALSE;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}

