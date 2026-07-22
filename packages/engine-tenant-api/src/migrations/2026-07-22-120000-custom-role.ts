import { MigrationBuilder } from '@contember/database-migrations'

// Custom tenant roles: runtime-defined global roles carrying a bundle of tenant
// permission actions. The definition lives here; assignment reuses the existing
// identity.roles + addGlobalIdentityRoles mechanism.
const sql = `
CREATE TABLE custom_role (
	id          UUID PRIMARY KEY,
	slug        TEXT NOT NULL UNIQUE,
	description TEXT,
	permissions TEXT[] NOT NULL,
	created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'custom_role_change';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
