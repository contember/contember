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

// A normal dependency is exactly what blocks DROP COLUMN without CASCADE. A view depends through its _RETURN rule,
// so it is named as the view itself; anything else (rule, function, trigger, policy) is described by PostgreSQL.
const dependentObjectsSql = `
SELECT DISTINCT
	CASE
		WHEN rewrite.rulename = '_RETURN' AND view_class.relkind = 'm' THEN 'materialized view ' || format('%I.%I', view_namespace.nspname, view_class.relname)
		WHEN rewrite.rulename = '_RETURN' THEN 'view ' || format('%I.%I', view_namespace.nspname, view_class.relname)
		ELSE pg_describe_object(dependency.classid, dependency.objid, dependency.objsubid)
	END AS description
FROM pg_depend dependency
JOIN pg_attribute attribute ON attribute.attrelid = dependency.refobjid AND attribute.attnum = dependency.refobjsubid
LEFT JOIN pg_rewrite rewrite ON dependency.classid = 'pg_rewrite'::regclass AND rewrite.oid = dependency.objid
LEFT JOIN pg_class view_class ON view_class.oid = rewrite.ev_class
LEFT JOIN pg_namespace view_namespace ON view_namespace.oid = view_class.relnamespace
WHERE dependency.refclassid = 'pg_class'::regclass
	AND dependency.refobjid = 'person'::regclass
	AND dependency.deptype = 'n'
	AND attribute.attname IN ('otp_uri', 'otp_activated_at')
ORDER BY 1
`

export default async function(builder: MigrationBuilder, args: MigrationArgs<TenantMigrationArgs>) {
	// Without this guard the DROP COLUMN below fails on objects a project created over the tenant person table (typically
	// views), and the engine cannot tell the operator why. Never drop them here: they belong to the project.
	const dependentObjects = (await args.connection.query<{ description: string }>(dependentObjectsSql)).rows
	if (dependentObjects.length > 0) {
		const names = dependentObjects.map(it => it.description).join(', ')
		throw new Error(
			`Tenant migration 2026-05-21-100000-person-mfa drops the columns person.otp_uri and person.otp_activated_at, `
				+ `but these database objects depend on them: ${names}. `
				+ `Drop these objects, or rewrite them so they no longer read those columns, and upgrade again. `
				+ `Nothing has been changed.`,
		)
	}
	builder.sql(sql)
}
