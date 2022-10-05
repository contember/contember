import { MigrationArgs, MigrationBuilder } from '@contember/database-migrations'
import { SystemMigrationArgs } from './types'

export default async function (builder: MigrationBuilder, args: MigrationArgs<SystemMigrationArgs>) {
	const hasGenRandomUuid = await args.connection.query(`
		SELECT 1
		FROM pg_proc
		JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
		WHERE pg_namespace.nspname ='pg_catalog' AND pg_proc.proname = 'gen_random_uuid'
	`)
	let randomUuidFn: string = 'uuid_generate_v4'
	if (hasGenRandomUuid.rowCount > 0) {
		randomUuidFn = 'gen_random_uuid'
	} else {
		const hasUuidGenV4 = await args.connection.query(`
			SELECT 1
			FROM pg_proc
			JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
			WHERE pg_namespace.nspname ='pg_catalog' AND pg_proc.proname = 'gen_random_uuid'
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

	builder.sql(`
CREATE DOMAIN "event_data_type" AS "text"
	CONSTRAINT "event_data_type_check" CHECK ((VALUE = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text"])));
CREATE DOMAIN "event_type" AS "text"
	CONSTRAINT "event_type_check" CHECK ((VALUE = ANY (ARRAY['init'::"text", 'create'::"text", 'update'::"text", 'delete'::"text", 'run_migration'::"text"])));
CREATE FUNCTION "trigger_event"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
		DECLARE new_event_type TEXT;
		DECLARE table_name TEXT;
		DECLARE values JSONB;
		DECLARE update_diff JSONB;
		DECLARE primary_values JSONB;
		DECLARE old_row JSONB;
		DECLARE new_row JSONB;
		BEGIN
			old_row := CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN TO_JSONB(old) ELSE NULL END;
			new_row := CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN TO_JSONB(new) ELSE NULL END;
			primary_values := (
				SELECT JSONB_AGG(value ORDER BY array_position(TG_ARGV, key))
				FROM JSONB_EACH(COALESCE(old_row, new_row))
				WHERE key = ANY (TG_ARGV)
			);
			table_name := tg_table_name;
			CASE TG_OP
				WHEN 'INSERT' THEN BEGIN
					new_event_type := 'create';
					values := COALESCE(
						(
							SELECT JSONB_OBJECT_AGG(key, value)
 						    FROM JSONB_EACH(new_row)
 						    WHERE NOT (key = ANY (TG_ARGV))
 						),
 						JSONB_BUILD_OBJECT()
 					);
				END;
				WHEN 'UPDATE' THEN BEGIN
					update_diff := (
						SELECT JSONB_OBJECT_AGG(COALESCE(n.key, o.key), n.value)
						FROM JSONB_EACH(old_row) o
 						FULL OUTER JOIN JSONB_EACH(new_row) n ON n.key = o.key
						WHERE n.value IS DISTINCT FROM o.value
					);
					IF (SELECT COUNT(*) FROM JSONB_OBJECT_KEYS(update_diff)) = 0 THEN
						RETURN NULL;
					END IF;
					new_event_type := 'update';
					values := update_diff;
				END;
				WHEN 'DELETE' THEN BEGIN
					new_event_type := 'delete';
				END;
				ELSE RAISE
					EXCEPTION 'Unknown TG_OP value %', TG_OP;
			END CASE;
			CASE WHEN NULLIF(CURRENT_SETTING('system.schema_id', true), '') IS NULL THEN
				PERFORM SET_CONFIG('system.schema_id', (select MAX("id")::TEXT from schema_migration), TRUE);
			ELSE
				-- do nothing
			END CASE;
			INSERT INTO "event_data" ("id", "type", "table_name", "row_ids", "values", "created_at", schema_id, identity_id)
			VALUES (
				"${randomUuidFn}"(),
				new_event_type,
				table_name,
				primary_values,
				values,
				CLOCK_TIMESTAMP(),
				CURRENT_SETTING('system.schema_id')::INT,
				COALESCE(
					CURRENT_SETTING('tenant.identity_id'::TEXT, TRUE)::UUID,
 					'00000000-0000-0000-0000-000000000000'::UUID)
 				);
			RETURN NULL;
		END;
		$$;
CREATE FUNCTION "trigger_event_commit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
	PERFORM PG_ADVISORY_XACT_LOCK(5218230332970456493); -- well-known random number
	CASE WHEN
			NULLIF(CURRENT_SETTING('system.transaction_id', TRUE), '') IS NOT NULL
			AND NULLIF(CURRENT_SETTING('system.transaction_inserted', TRUE), '') IS NULL
		THEN
			INSERT INTO stage_transaction(transaction_id, stage_id, applied_at)
			VALUES (CURRENT_SETTING('system.transaction_id')::UUID,
					(
						SELECT id
						FROM stage
						WHERE schema = TG_TABLE_SCHEMA
					),
					CLOCK_TIMESTAMP())
			ON CONFLICT DO NOTHING;
			PERFORM SET_CONFIG('system.transaction_inserted', '1', TRUE);
		ELSE
		-- do nothing
		END CASE;
	RETURN NULL;
END
$$;
CREATE TABLE "event_data" (
    "id" "uuid" NOT NULL,
    "type" "event_data_type" NOT NULL,
    "table_name" "text" NOT NULL,
    "row_ids" "jsonb" NOT NULL,
    "values" "jsonb",
    "created_at" timestamp with time zone DEFAULT "clock_timestamp"() NOT NULL,
    "schema_id" integer NOT NULL,
    "identity_id" "uuid" NOT NULL,
    "transaction_id" "uuid" DEFAULT COALESCE((NULLIF("current_setting"('system.transaction_id'::"text", true), ''::"text"))::"uuid", ("set_config"('system.transaction_id'::"text", ("${randomUuidFn}"())::"text", true))::"uuid") NOT NULL
);
CREATE TABLE "schema_migration" (
    "id" integer NOT NULL,
    "version" character varying(20) NOT NULL,
    "name" character varying(255) NOT NULL,
    "migration" "json" NOT NULL,
    "checksum" character(32) NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
CREATE SEQUENCE "schema_migration_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "schema_migration_id_seq" OWNED BY "schema_migration"."id";
CREATE TABLE "stage" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "schema" "text" NOT NULL
);
CREATE TABLE "stage_transaction" (
    "transaction_id" "uuid" NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "applied_at" timestamp with time zone NOT NULL
);
ALTER TABLE ONLY "schema_migration" ALTER COLUMN "id" SET DEFAULT "nextval"('"schema_migration_id_seq"'::"regclass");
ALTER TABLE ONLY "event_data"
    ADD CONSTRAINT "event_data_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "schema_migration"
    ADD CONSTRAINT "schema_migration_name_key" UNIQUE ("name");
ALTER TABLE ONLY "schema_migration"
    ADD CONSTRAINT "schema_migration_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "schema_migration"
    ADD CONSTRAINT "schema_migration_version_key" UNIQUE ("version");
ALTER TABLE ONLY "stage"
    ADD CONSTRAINT "stage_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "stage"
    ADD CONSTRAINT "stage_schema_key" UNIQUE ("schema");
ALTER TABLE ONLY "stage"
    ADD CONSTRAINT "stage_slug_key" UNIQUE ("slug");
ALTER TABLE ONLY "stage_transaction"
    ADD CONSTRAINT "stage_transaction_pkey" PRIMARY KEY ("transaction_id", "stage_id");
CREATE INDEX "event_data_created" ON "event_data" USING "btree" ("created_at");
CREATE INDEX "system_event2_table_name" ON "event_data" USING "btree" ("table_name");
CREATE INDEX "system_event2_transaction" ON "event_data" USING "btree" ("transaction_id");
CREATE INDEX "system_event2_type" ON "event_data" USING "btree" ("type");
CREATE INDEX "system_event_row_id" ON "event_data" USING "btree" ("row_ids");
CREATE INDEX "system_schema_migration_version" ON "schema_migration" USING "btree" ("version");
CREATE INDEX "transaction_applied" ON "stage_transaction" USING "btree" ("applied_at");
ALTER TABLE ONLY "event_data"
    ADD CONSTRAINT "event_data_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "schema_migration"("id");
ALTER TABLE ONLY "stage_transaction"
    ADD CONSTRAINT "stage_transaction_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stage"("id") ON DELETE CASCADE;
DO LANGUAGE plpgsql
$$
	BEGIN
		EXECUTE FORMAT('ALTER FUNCTION trigger_event_commit() SET SEARCH_PATH = %s', QUOTE_IDENT(CURRENT_SCHEMA()));
		EXECUTE FORMAT('ALTER FUNCTION trigger_event() SET SEARCH_PATH = %s', QUOTE_IDENT(CURRENT_SCHEMA()));
	END
$$

`)
}
