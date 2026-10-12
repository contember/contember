import { MigrationBuilder } from '@contember/database-migrations'

// `authLog` reads a time range newest first; the existing indexes all lead with a person or an identifier.
const sql = `
CREATE INDEX IF NOT EXISTS "person_auth_log_created_at_id_idx" ON "person_auth_log" ("created_at" DESC, "id" DESC);
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
