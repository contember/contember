import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TYPE SCHEMA_SINGLE AS ENUM ('single');
CREATE TABLE "schema"
(
	id         SCHEMA_SINGLE NOT NULL PRIMARY KEY DEFAULT 'single',
	schema     JSONB         NOT NULL,
	updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
	checksum   CHAR(32)      NOT NULL,
	version    VARCHAR(20)   NOT NULL,
	migration_id INT         NOT NULL REFERENCES schema_migration(id) DEFERRABLE INITIALLY DEFERRED
);
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
