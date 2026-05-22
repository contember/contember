import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TABLE person_backup_code (
	id         UUID PRIMARY KEY,
	person_id  UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
	code_hash  TEXT NOT NULL,
	used_at    TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON person_backup_code (person_id);

CREATE TABLE auth_policy (
	id                  UUID PRIMARY KEY,
	scope               TEXT NOT NULL,
	project_id          UUID REFERENCES project(id) ON DELETE CASCADE,
	roles               TEXT[] NOT NULL,
	mfa_required        BOOLEAN,
	token_expiration    INTERVAL,
	idle_timeout        INTERVAL,
	remember_me_allowed BOOLEAN,
	created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON auth_policy (project_id);

ALTER TABLE api_key ADD COLUMN issued_at TIMESTAMPTZ;
ALTER TABLE person ADD COLUMN mfa_grace_until TIMESTAMPTZ;

ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'backup_code_generated';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'backup_code_used';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'backup_code_regenerated';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'email_otp_sent';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'mfa_enrollment_required';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'mfa_reset';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'session_expired_idle';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'session_policy_applied';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'auth_policy_change';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
