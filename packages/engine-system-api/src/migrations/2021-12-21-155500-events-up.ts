import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE INDEX event_data_created ON event_data (created_at);
CREATE INDEX transaction_applied ON stage_transaction (applied_at);

ALTER TABLE stage
	DROP event_id;
DROP TABLE event_bak;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
