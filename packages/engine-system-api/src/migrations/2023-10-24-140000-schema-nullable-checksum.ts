import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TYPE SCHEMA_MIGRATION_TYPE AS ENUM('schema', 'content');
ALTER TABLE schema_migration ALTER checksum DROP NOT NULL,
ADD COLUMN type SCHEMA_MIGRATION_TYPE NOT NULL DEFAULT 'schema';
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
