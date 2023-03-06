import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "api_key"
    ADD COLUMN "disabled_at" TIMESTAMP;

UPDATE "api_key"
SET "disabled_at" = "created_at"
WHERE "enabled" = FALSE;

ALTER TABLE "api_key"
    DROP COLUMN "enabled";
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
