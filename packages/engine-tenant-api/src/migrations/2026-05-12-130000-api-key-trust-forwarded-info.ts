import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "api_key"
	ADD COLUMN "trust_forwarded_info" BOOLEAN NOT NULL DEFAULT false;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
