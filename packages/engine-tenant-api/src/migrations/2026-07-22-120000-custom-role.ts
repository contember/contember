import { MigrationBuilder } from '@contember/database-migrations'

// Custom tenant roles: runtime-defined global roles carrying validated grants.
const sql = `
CREATE TABLE custom_role (
	id          UUID PRIMARY KEY,
	slug        TEXT NOT NULL UNIQUE,
	description TEXT,
	grants      JSONB NOT NULL CHECK (jsonb_typeof(grants) = 'array'),
	created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
	deleted_at  TIMESTAMPTZ
);

ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'custom_role_change';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
