import { MigrationBuilder, Name } from '@contember/database-migrations'
import { SystemMigrationArgs } from './types'
import { getJunctionTables } from '../model'
import { MigrationArgs } from '@contember/database-migrations/dist/src/Migration'

const createTrxEvent = (builder: MigrationBuilder, tableName: Name) => {
	builder.createTrigger(tableName, 'log_event_trx', {
		when: 'AFTER',
		operation: ['INSERT', 'UPDATE', 'DELETE'],
		level: 'ROW',
		deferrable: true,
		deferred: true,
		function: {
			schema: 'system',
			name: 'trigger_event_commit',
		},
	})
}

export default async function (builder: MigrationBuilder, args: MigrationArgs<SystemMigrationArgs>) {
	const schema = await args.schemaResolver(args.connection)
	const junctionTables = getJunctionTables(schema.model)
	const schemas = args.project.stages.map(it => `stage_${it.slug}`)
	builder.sql(`LOCK TABLE event`)
	builder.sql(`
		ALTER TABLE schema_migration
		ADD PRIMARY KEY (id)
	`)
	builder.sql(`
		CREATE DOMAIN event_data_type AS TEXT
		CONSTRAINT event_data_type_check CHECK (VALUE = ANY (ARRAY ['create', 'update', 'delete']));
	`)
	builder.sql(`
		CREATE TABLE event_data (
			id UUID NOT NULL CONSTRAINT event_data_pkey PRIMARY KEY,
		type event_data_type NOT NULL,
		table_name TEXT NOT NULL,
		row_ids JSONB NOT NULL,
		values JSONB DEFAULT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CLOCK_TIMESTAMP() NOT NULL,
		schema_id INTEGER NOT NULL REFERENCES schema_migration(id),
		identity_id UUID NOT NULL,
		transaction_id UUID DEFAULT COALESCE(
			(NULLIF(CURRENT_SETTING('system.transaction_id'::TEXT, TRUE), ''::TEXT))::UUID,
			(SET_CONFIG('system.transaction_id'::TEXT, ("uuid_generate_v4"())::TEXT, TRUE))::UUID) NOT NULL
		)
	`)
	builder.sql(`
		CREATE INDEX system_event_row_id
		ON event_data(row_ids)
	`)
	builder.sql(`
		CREATE INDEX system_event2_table_name
		ON event_data(table_name)
	`)
	builder.sql(`
		CREATE INDEX system_event2_type
		ON event_data(type)
	`)
	builder.sql(`
		CREATE INDEX system_event2_transaction
		ON event_data(transaction_id)
	`)
	builder.sql(`
		CREATE TABLE stage_transaction (
			transaction_id UUID NOT NULL,
			stage_id UUID NOT NULL REFERENCES stage(id) ON DELETE CASCADE,
			applied_at TIMESTAMPTZ NOT NULL,
			PRIMARY KEY (transaction_id, stage_id)
		)
	`)
	builder.sql(`
		WITH RECURSIVE
		events AS (
			SELECT
				e.*,
				(SELECT MAX(id) FROM schema_migration) AS schema_id,
				1 AS index,
				stage.id AS stage_id
			FROM stage
			JOIN event e ON stage.event_id = e.id
 			UNION ALL
 			SELECT
 				event.*,
 				COALESCE(
 					CASE WHEN event.type = 'run_migration' THEN
						(SELECT id FROM schema_migration WHERE version = event.data ->> 'version')
					END,
					events.schema_id
				),
 				index + 1,
 				stage_id
 			FROM event
 				JOIN events
 			ON events.previous_id = event.id
 		),
 		shifted_events AS (
 			SELECT
 				*,
 				(
 					created_at
 					+ (ROW_NUMBER() OVER (PARTITION BY transaction_id ORDER BY index DESC ) - 1 ||' us')::INTERVAL
 				) AS shifted_created_at
 			FROM events
 		)
 		INSERT
 		INTO event_data (id, type, table_name, row_ids, values, created_at, schema_id, identity_id, transaction_id)
 		SELECT
 			id,
 			type,
 			data ->> 'tableName',
 			data -> 'rowId',
 			data -> 'values',
 			shifted_created_at,
 			schema_id,
 			identity_id,
 			transaction_id
 		FROM shifted_events
 		WHERE type NOT IN ('init', 'run_migration')
 		ON CONFLICT DO NOTHING
 	`)
	builder.sql(`
		WITH RECURSIVE
 		events AS (
 			SELECT
 				e.*,
 				1 AS index,
 				stage.id AS stage_id
 			FROM stage
 			JOIN event e ON stage.event_id = e.id
 			UNION ALL
 			SELECT
 				event.*,
 				index + 1,
 				stage_id
 			FROM event
 			JOIN events ON events.previous_id = event.id
 		),
 		transaction_times AS (
 			SELECT
 				DISTINCT ON (transaction_id, stage_id)
 				transaction_id,
 				created_at,
 				index,
 				stage_id
 			FROM events
 			ORDER BY transaction_id
 		)
 		INSERT
 		INTO stage_transaction (transaction_id, stage_id, applied_at)
 		SELECT transaction_id, stage_id, created_at
 		FROM transaction_times
	`)
	builder.sql(`
		CREATE OR REPLACE FUNCTION "trigger_event"() RETURNS TRIGGER AS
		$$
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
				"uuid_generate_v4"(),
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
		$$ LANGUAGE plpgsql
	`)
	builder.sql(`
		CREATE OR REPLACE FUNCTION trigger_event_commit() RETURNS TRIGGER AS
		$$
		BEGIN
			PERFORM PG_ADVISORY_XACT_LOCK(5218230332970456493); -- well-known random number

			CASE WHEN
				NULLIF(CURRENT_SETTING('system.transaction_id', true), '') IS NOT NULL
				AND NULLIF(CURRENT_SETTING('system.transaction_inserted', true), '') IS NULL
				THEN
				INSERT INTO stage_transaction(transaction_id, stage_id, applied_at)
				VALUES (
					CURRENT_SETTING('system.transaction_id')::UUID,
					(
						SELECT id
 						FROM "stage"
 						WHERE "slug" = RIGHT(TG_TABLE_SCHEMA, - LENGTH('stage_'))
 				    ),
					CLOCK_TIMESTAMP()
				)
				ON CONFLICT DO NOTHING;

				PERFORM SET_CONFIG('system.transaction_inserted', '1', true);
			ELSE
				-- do nothing
			END CASE;

			RETURN NULL;
		END;
		$$ LANGUAGE plpgsql
	`)

	for (const table of junctionTables) {
		for (const schema of schemas) {
			builder.dropTrigger({ name: table.tableName, schema }, 'log_event_statement')
			createTrxEvent(builder, { name: table.tableName, schema })
		}
	}
	for (const entity of Object.values(schema.model.entities)) {
		for (const schema of schemas) {
			builder.dropTrigger({ name: entity.tableName, schema }, 'log_event_statement')
			createTrxEvent(builder, { name: entity.tableName, schema })
		}
	}
	builder.sql(`
		ALTER TABLE stage
		ALTER event_id DROP NOT NULL
	`)
	builder.sql(`
		ALTER TABLE event
		RENAME TO event_bak
	`)
}
