import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TABLE identity_provider (
	id            UUID        NOT NULL,
	slug          TEXT UNIQUE NOT NULL,
	type          TEXT        NOT NULL,
	configuration JSONB       NOT NULL,
	disabled_at   TIMESTAMP DEFAULT NULL,
	CONSTRAINT identity_provider_id PRIMARY KEY ("id")
);
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
