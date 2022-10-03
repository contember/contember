import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "schema_migration"
	ALTER "executed_at" TYPE TIMESTAMPTZ,
	ALTER "executed_at" SET DEFAULT now();

ALTER TABLE "event"
	ALTER "created_at" TYPE TIMESTAMPTZ;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
