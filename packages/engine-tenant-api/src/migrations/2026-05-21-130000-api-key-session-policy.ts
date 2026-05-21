import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "api_key"
	ADD COLUMN "idle_timeout" INTERVAL,
	ADD COLUMN "max_expires_at" TIMESTAMPTZ;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
