import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TYPE CONFIG_SINGLETON AS ENUM ('singleton');
CREATE TYPE CONFIG_POLICY AS ENUM ('always', 'never', 'optIn', 'optOut');
CREATE TABLE "config"
(
	id                              CONFIG_SINGLETON PRIMARY KEY DEFAULT 'singleton',
	passwordless_enabled            CONFIG_POLICY NOT NULL       DEFAULT 'never',
	passwordless_url                TEXT,
	passwordless_expiration_minutes INTEGER       NOT NULL       DEFAULT 5
);
INSERT INTO "config" (id)
VALUES (DEFAULT);

ALTER TABLE person_password_reset
	RENAME TO person_token;
CREATE TYPE PERSON_TOKEN_TYPE AS ENUM ('password_reset', 'passwordless');
ALTER TABLE person_token
	ADD COLUMN type PERSON_TOKEN_TYPE NOT NULL DEFAULT 'password_reset',
	ADD COLUMN otp_hash TEXT DEFAULT NULL,
	ADD COLUMN otp_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE person
	ADD COLUMN passwordless_enabled BOOLEAN DEFAULT NULL;

`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
