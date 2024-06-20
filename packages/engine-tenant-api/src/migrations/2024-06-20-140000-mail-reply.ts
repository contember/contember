import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE mail_template
	ADD COLUMN reply_to TEXT;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
