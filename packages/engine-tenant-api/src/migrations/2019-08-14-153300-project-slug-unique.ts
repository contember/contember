import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE UNIQUE INDEX "project_slug"
	ON "project"("slug");
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
