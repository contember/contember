import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
DROP FUNCTION rebase_events_unsafe(head UUID, oldbase UUID, newbase UUID, appliedevents UUID[]);
DROP FUNCTION statement_trigger_event();
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
