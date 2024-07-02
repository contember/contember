import { snapshotMigration } from './snapshot-factory'
export default snapshotMigration(({ randomUuidFn }) => `
CREATE DOMAIN "event_data_type" AS "text"
	CONSTRAINT "event_data_type_check" CHECK ((VALUE = ANY (ARRAY['create'::"text", 'update'::"text", 'delete'::"text"])));
CREATE DOMAIN "event_type" AS "text"
	CONSTRAINT "event_type_check" CHECK ((VALUE = ANY (ARRAY['init'::"text", 'create'::"text", 'update'::"text", 'delete'::"text", 'run_migration'::"text"])));
CREATE TYPE "schema_migration_type" AS ENUM (
    'schema',
    'content'
);
CREATE TYPE "schema_single" AS ENUM (
    'single'
);
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
CREATE TABLE "schema" (
    "id" "schema_single" DEFAULT 'single'::"schema_single" NOT NULL,
    "schema" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checksum" character(32) NOT NULL,
    "version" character varying(20) NOT NULL,
    "migration_id" integer NOT NULL
);
CREATE TABLE "schema_migration" (
    "id" integer NOT NULL,
    "version" character varying(20) NOT NULL,
    "name" character varying(255) NOT NULL,
    "migration" "json" NOT NULL,
    "checksum" character(32),
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "schema_migration_type" DEFAULT 'schema'::"schema_migration_type" NOT NULL
);
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
ALTER TABLE ONLY "event_data"
    ADD CONSTRAINT "event_data_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "schema_migration"
    ADD CONSTRAINT "schema_migration_name_key" UNIQUE ("name");
ALTER TABLE ONLY "schema_migration"
    ADD CONSTRAINT "schema_migration_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "schema_migration"
    ADD CONSTRAINT "schema_migration_version_key" UNIQUE ("version");
ALTER TABLE ONLY "schema"
    ADD CONSTRAINT "schema_pkey" PRIMARY KEY ("id");
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
ALTER TABLE ONLY "schema"
    ADD CONSTRAINT "schema_migration_id_fkey" FOREIGN KEY ("migration_id") REFERENCES "schema_migration"("id") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE ONLY "stage_transaction"
    ADD CONSTRAINT "stage_transaction_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stage"("id") ON DELETE CASCADE;
`)
