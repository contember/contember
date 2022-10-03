import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE person
	ADD name TEXT;
UPDATE person
SET name = SPLIT_PART(email, '@', 1);
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}

