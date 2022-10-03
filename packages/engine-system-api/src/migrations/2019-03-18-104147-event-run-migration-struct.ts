import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
UPDATE event
SET data = jsonb_build_object('version', coalesce(substring(data ->> 'file', 0, 17), data ->> 'version'))
WHERE type = 'run_migration';
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
