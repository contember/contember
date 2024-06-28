import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE schema_migration ALTER id DROP DEFAULT;
DO LANGUAGE plpgsql
$$
	BEGIN
		EXECUTE FORMAT('DROP SEQUENCE %s', PG_GET_SERIAL_SEQUENCE('schema_migration', 'id'));
	END
$$
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
