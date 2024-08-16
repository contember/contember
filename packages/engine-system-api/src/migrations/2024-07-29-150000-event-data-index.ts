import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE INDEX IF NOT EXISTS system_event_data_row_id_0 ON event_data USING btree ((row_ids -> 0));
CREATE INDEX IF NOT EXISTS system_event_data_row_id_1 ON event_data USING btree ((row_ids -> 1));
DROP INDEX IF EXISTS system_event_row_id;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
