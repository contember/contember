import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
DO
$BLOCK$
    BEGIN
        IF NOT EXISTS(
          SELECT
          FROM pg_proc
                   JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
          WHERE pg_namespace.nspname = 'public' AND pg_proc.proname = 'uuid_generate_v4'
            ) THEN
            CREATE FUNCTION public."uuid_generate_v4"() RETURNS UUID
            AS
            $$
            SELECT OVERLAY(OVERLAY(md5(random()::TEXT || ':' || clock_timestamp()::TEXT) PLACING '4' FROM 13) PLACING
                           to_hex(floor(random() * (11 - 8 + 1) + 8)::INT)::TEXT FROM 17)::UUID;
            $$ LANGUAGE SQL;
            END IF;
    END
$BLOCK$;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
