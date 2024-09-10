import { MigrationArgs, MigrationBuilder } from '@contember/database-migrations'
import { SystemMigrationArgs } from './types'

export const snapshotMigration = (sqlFactory: (args: { randomUuidFn: string }) => string) => {
	return async (builder: MigrationBuilder, args: MigrationArgs<SystemMigrationArgs>) => {
		const hasGenRandomUuid = await args.connection.query(`
            SELECT 1
            FROM pg_proc
            JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
            WHERE pg_namespace.nspname = 'pg_catalog' AND pg_proc.proname = 'gen_random_uuid'
		`)
		let randomUuidFn: string = 'uuid_generate_v4'
		if ((hasGenRandomUuid.rowCount ?? 0) > 0) {
			randomUuidFn = 'gen_random_uuid'
		} else {
			const hasUuidGenV4 = await args.connection.query(`
                SELECT 1
                FROM pg_proc
                JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
                WHERE pg_namespace.nspname = 'pg_catalog' AND pg_proc.proname = 'uuid_generate_v4'
			`)
			if (hasUuidGenV4.rowCount === 0) {
				builder.sql(`
				CREATE FUNCTION "uuid_generate_v4"() RETURNS "uuid"
    			LANGUAGE "sql"
    			AS $$
            		SELECT OVERLAY(OVERLAY(md5(random()::TEXT || ':' || clock_timestamp()::TEXT) PLACING '4' FROM 13) PLACING
                           to_hex(floor(random() * (11 - 8 + 1) + 8)::INT)::TEXT FROM 17)::UUID;
            	$$;
            `)
			}
		}
		const sql = sqlFactory({ randomUuidFn })
		builder.sql(sql)

		builder.sql(`DO LANGUAGE plpgsql
$$
	BEGIN
		EXECUTE FORMAT('ALTER FUNCTION trigger_event_commit() SET SEARCH_PATH = %s', QUOTE_IDENT(CURRENT_SCHEMA()));
		EXECUTE FORMAT('ALTER FUNCTION trigger_event() SET SEARCH_PATH = %s', QUOTE_IDENT(CURRENT_SCHEMA()));
	END
$$`)

	}
}
