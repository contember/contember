import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE identity_provider
    ALTER disabled_at TYPE TIMESTAMPTZ;

ALTER TABLE api_key
    ALTER disabled_at TYPE TIMESTAMPTZ,
    ALTER created_at TYPE TIMESTAMPTZ,
    ALTER expires_at TYPE TIMESTAMPTZ;

ALTER TABLE identity
	ALTER created_at TYPE TIMESTAMPTZ;

ALTER TABLE person
	ALTER otp_activated_at TYPE TIMESTAMPTZ;

ALTER TABLE person_password_reset
	ALTER expires_at TYPE TIMESTAMPTZ,
	ALTER created_at TYPE TIMESTAMPTZ,
	ALTER used_at TYPE TIMESTAMPTZ;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}


