import { MigrationArgs, MigrationBuilder } from '@contember/database-migrations'
import { TenantMigrationArgs } from './types.js'

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

// Views (and materialized views) record their column dependencies through their pg_rewrite rule.
const dependentViewsSql = `
SELECT DISTINCT view_namespace.nspname AS schema, view_class.relname AS name
FROM pg_depend dependency
JOIN pg_rewrite rewrite ON rewrite.oid = dependency.objid
JOIN pg_class view_class ON view_class.oid = rewrite.ev_class
JOIN pg_namespace view_namespace ON view_namespace.oid = view_class.relnamespace
JOIN pg_attribute attribute ON attribute.attrelid = dependency.refobjid AND attribute.attnum = dependency.refobjsubid
WHERE dependency.classid = 'pg_rewrite'::regclass
	AND dependency.refclassid = 'pg_class'::regclass
	AND dependency.refobjid = 'person'::regclass
	AND attribute.attname IN ('otp_uri', 'otp_activated_at')
ORDER BY 1, 2
`

export default async function(builder: MigrationBuilder, args: MigrationArgs<TenantMigrationArgs>) {
	// Without this guard the DROP COLUMN below fails on views a project created over the tenant person table, and the
	// engine cannot tell the operator why. Never drop those views here: they belong to the project.
	const dependentViews = (await args.connection.query<{ schema: string; name: string }>(dependentViewsSql)).rows
	if (dependentViews.length > 0) {
		const names = dependentViews.map(it => `"${it.schema}"."${it.name}"`).join(', ')
		throw new Error(
			`Tenant migration 2026-05-21-100000-person-mfa drops the columns person.otp_uri and person.otp_activated_at, `
				+ `but these database views read them: ${names}. `
				+ `Drop these views, or rewrite them so they no longer read those columns, and upgrade again. `
				+ `Nothing has been changed.`,
		)
	}
	builder.sql(sql)
}
