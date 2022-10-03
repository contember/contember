import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
DO LANGUAGE plpgsql
$$
	BEGIN
		EXECUTE FORMAT('ALTER FUNCTION trigger_event_commit() SET SEARCH_PATH = %s', QUOTE_IDENT(CURRENT_SCHEMA()));
		EXECUTE FORMAT('ALTER FUNCTION trigger_event() SET SEARCH_PATH = %s', QUOTE_IDENT(CURRENT_SCHEMA()));
	END
$$
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
