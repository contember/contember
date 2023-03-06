import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE INDEX project_alias ON project USING gin ((config -> 'alias'));
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}

