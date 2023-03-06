import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE project
	ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::JSONB,
    add column updated_at timestamptz not null DEFAULT now();
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}

