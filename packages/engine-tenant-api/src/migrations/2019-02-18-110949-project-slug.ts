import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "project"
	ADD COLUMN slug TEXT DEFAULT NULL;

UPDATE "project"
SET slug = name;

ALTER TABLE "project"
	ALTER slug DROP DEFAULT,
	ALTER slug SET NOT NULL;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
