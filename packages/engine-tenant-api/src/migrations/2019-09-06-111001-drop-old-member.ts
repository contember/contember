import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
DROP TABLE project_member;
DROP TABLE project_member_variable;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
