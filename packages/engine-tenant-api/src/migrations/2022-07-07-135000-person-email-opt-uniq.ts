import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE person
	ALTER email DROP NOT NULL,
	ADD CONSTRAINT email_unique UNIQUE (email);
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
