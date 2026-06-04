import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TABLE person_mfa (
	person_id               UUID PRIMARY KEY REFERENCES person(id) ON DELETE CASCADE,
	totp_secret             BYTEA,
	totp_secret_version     INTEGER,
	totp_activated_at       TIMESTAMPTZ,
	totp_pending_secret     BYTEA,
	totp_pending_version    INTEGER,
	totp_pending_created_at TIMESTAMPTZ,
	email_otp_enabled       BOOLEAN NOT NULL DEFAULT FALSE
);

-- Migrate existing TOTP factors. The legacy plaintext otpauth URI is stored
-- as version 0 (utf8 bytes of the URI). Version >= 1 means an encrypted secret.
INSERT INTO person_mfa (person_id, totp_secret, totp_secret_version, totp_activated_at)
SELECT id, convert_to(otp_uri, 'UTF8'), 0, otp_activated_at
FROM person WHERE otp_uri IS NOT NULL;

ALTER TABLE person DROP COLUMN otp_uri, DROP COLUMN otp_activated_at;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
