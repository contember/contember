import { MigrationBuilder } from '@contember/database-migrations'

// The new domain constraint is a strict superset of the old one (it only adds 'truncate'),
// so every existing `event_data` row is already known-valid. We add it as NOT VALID to skip
// the full validation scan of `event_data` — which is the content event log and typically the
// largest table in the system schema — that PostgreSQL would otherwise run while holding locks
// inside the migration transaction. New/updated rows are still checked, and no VALIDATE is needed.
const sql = `
ALTER DOMAIN "event_data_type" DROP CONSTRAINT "event_data_type_check";
ALTER DOMAIN "event_data_type"
	ADD CONSTRAINT "event_data_type_check" CHECK ((VALUE = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text", 'truncate'::"text"]))) NOT VALID;
ALTER TABLE "event_data" ALTER COLUMN "table_name" DROP NOT NULL;
ALTER TABLE "event_data" ALTER COLUMN "row_ids" DROP NOT NULL;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
