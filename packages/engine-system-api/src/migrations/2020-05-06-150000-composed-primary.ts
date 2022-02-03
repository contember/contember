import { escapeValue, MigrationBuilder, Name } from '@contember/database-migrations'
import { SystemMigrationArgs } from './types'
import { formatSchemaName, getJunctionTables } from '../model'

const createEventTrigger = (builder: MigrationBuilder, tableName: Name, primaryColumns: string[]) => {
	builder.createTrigger(tableName, 'log_event', {
		when: 'AFTER',
		operation: ['INSERT', 'UPDATE', 'DELETE'],
		level: 'ROW',
		function: {
			schema: 'system',
			name: 'trigger_event',
		},
		functionParams: primaryColumns,
	})
}

const migrateEvents = (builder: MigrationBuilder, tableName: string, primaryKeys: [string, string]) => {
	builder.sql(`
		WITH RECURSIVE
			recent_events(id, type, previous_id, data, created_at, stage) AS (
				SELECT event.id, type, previous_id, data, created_at, stage.slug
				FROM system.event
				JOIN system.stage ON stage.event_id = event.id

				UNION ALL

				SELECT event.id, event.type, event.previous_id, event.data, event.created_at, recent_events.stage
				FROM system.event, recent_events
				WHERE event.id = recent_events.previous_id
			),
			affected_events AS (
				SELECT
					delete_event.id AS delete_id,
					create_event.id AS create_id,
					json_build_array(
						create_event.data -> 'values' ->> ${escapeValue(primaryKeys[0])},
						create_event.data -> 'values' ->> ${escapeValue(primaryKeys[1])}
					) AS id
				FROM recent_events AS create_event
				LEFT JOIN recent_events AS delete_event
					ON
						delete_event.data ->> 'rowId' = create_event.data ->> 'rowId'
						AND delete_event.type = 'delete'
						AND delete_event.data ->> 'tableName' = create_event.data ->> 'tableName'
				WHERE create_event.type = 'create' AND create_event.data ->> 'tableName' = ${escapeValue(tableName)}
			)
		UPDATE event
		SET
			data = event.data || jsonb_build_object('rowId', affected_events.id)
		FROM affected_events
		WHERE
		      event.id = affected_events.create_id
		      OR event.id = affected_events.delete_id
		RETURNING event.data
`)
}

export default async function (builder: MigrationBuilder, args: SystemMigrationArgs) {
	const schema = await args.schemaResolver()
	const tablesToMigrate = getJunctionTables(schema.model)
	const schemas = args.project.stages.map(formatSchemaName)
	for (const table of tablesToMigrate) {
		const primaryColumns: [string, string] = [table.joiningColumn.columnName, table.inverseJoiningColumn.columnName]
		for (const schema of schemas) {
			builder.dropColumn({ name: table.tableName, schema }, 'id')
			builder.dropConstraint(
				{ name: table.tableName, schema },
				table.tableName + '_uniq_' + table.joiningColumn.columnName + '_' + table.inverseJoiningColumn.columnName,
			)
			builder.addConstraint({ name: table.tableName, schema }, null, {
				primaryKey: [table.joiningColumn.columnName, table.inverseJoiningColumn.columnName],
			})
			builder.dropTrigger({ name: table.tableName, schema }, 'log_event')
			createEventTrigger(builder, { name: table.tableName, schema }, primaryColumns)
		}
		migrateEvents(builder, table.tableName, primaryColumns)
	}
	for (const entity of Object.values(schema.model.entities)) {
		for (const schema of schemas) {
			builder.dropTrigger({ name: entity.tableName, schema }, 'log_event')
			createEventTrigger(builder, { name: entity.tableName, schema }, [entity.primaryColumn])
		}
	}
	builder.sql(`
		UPDATE system.event
		SET data = data || jsonb_build_object('rowId', json_build_array(data ->> 'rowId'))
		WHERE jsonb_typeof(data -> 'rowId') = 'string'
	`)
	builder.sql(`CREATE OR REPLACE FUNCTION "system"."trigger_event"() RETURNS TRIGGER AS
$$

DECLARE
	new_event_id UUID := system.uuid_generate_v4();
	DECLARE new_event_type TEXT;
	DECLARE new_event_data JSONB;
	DECLARE current_stage RECORD;
	DECLARE update_diff JSONB;
	DECLARE primary_values JSONB;
	DECLARE old_row JSONB;
	DECLARE new_row JSONB;
BEGIN
	old_row := CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(old) ELSE NULL END;
    new_row := CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(new) ELSE NULL END;
	primary_values = (
		SELECT jsonb_agg(value ORDER BY array_position(TG_ARGV, key))
		FROM jsonb_each(COALESCE(old_row, new_row))
		WHERE key = ANY (TG_ARGV)
	);

	CASE TG_OP
		WHEN 'INSERT' THEN BEGIN
			new_event_type := 'create';
			new_event_data := jsonb_build_object(
			  'tableName', TG_TABLE_NAME,
			  'rowId', primary_values,
			  'values', COALESCE((
				  SELECT jsonb_object_agg(key, value)
				  FROM jsonb_each(new_row)
				  WHERE NOT (key = ANY (TG_ARGV))
			  ), '{}'::JSONB)
				);
		END;
		WHEN 'UPDATE' THEN BEGIN
			update_diff := (
				SELECT jsonb_object_agg(coalesce(n.key, o.key), n.value)
				FROM jsonb_each(old_row) o
						 FULL OUTER JOIN
				jsonb_each(new_row) n ON n.key = o.key
				WHERE n.value IS DISTINCT FROM o.value
			);
			IF (SELECT count(*) FROM jsonb_object_keys(update_diff)) = 0 THEN
				RETURN NULL;
				END IF;
			new_event_type := 'update';
			new_event_data := jsonb_build_object(
			  'tableName', TG_TABLE_NAME,
			  'rowId', primary_values,
			  'values', update_diff
				);
		END;
		WHEN 'DELETE' THEN BEGIN
			new_event_type := 'delete';
			new_event_data := jsonb_build_object(
			  'tableName', TG_TABLE_NAME,
			  'rowId', primary_values
				);
		END;
		ELSE RAISE
			EXCEPTION 'Unknown TG_OP value %', TG_OP;
		END CASE;

	SELECT "id", "event_id"
	FROM "system"."stage"
	WHERE "slug" = right(TG_TABLE_SCHEMA, -length('stage_'))
		FOR NO KEY UPDATE
	INTO current_stage;

	INSERT INTO "system"."event" ("id", "type", "data", "previous_id")
	VALUES (new_event_id, new_event_type, new_event_data, current_stage.event_id);

	UPDATE "system"."stage"
	SET "event_id" = new_event_id
	WHERE "id" = current_stage.id;

	RETURN NULL;
END;

$$ LANGUAGE plpgsql;
`)
	builder.dropFunction(
		{
			schema: 'system',
			name: 'make_diff',
		},
		[
			{ name: 'old', type: 'jsonb' },
			{ name: 'new', type: 'jsonb' },
		],
	)
}
