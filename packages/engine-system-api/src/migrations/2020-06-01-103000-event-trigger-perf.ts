import { MigrationBuilder, Name } from '@contember/database-migrations'
import { SystemMigrationArgs } from './types'
import { getJunctionTables } from '../model'
import { MigrationArgs } from '@contember/database-migrations/dist/src/Migration'

const createEventStatementTrigger = (builder: MigrationBuilder, tableName: Name) => {
	builder.createTrigger(tableName, 'log_event_statement', {
		when: 'AFTER',
		operation: ['INSERT', 'UPDATE', 'DELETE'],
		level: 'STATEMENT',
		function: {
			schema: 'system',
			name: 'statement_trigger_event',
		},
	})
}

export default async function (builder: MigrationBuilder, args: MigrationArgs<SystemMigrationArgs>) {
	const schema = await args.schemaResolver(args.connection)
	const junctionTables = getJunctionTables(schema.model)
	const schemas = args.project.stages.map(it => `stage_${it.slug}`)
	builder.sql(`CREATE OR REPLACE FUNCTION "trigger_event"() RETURNS TRIGGER AS $$
DECLARE
    DECLARE new_event_type TEXT;
    DECLARE previous_id UUID;
    DECLARE new_event_data JSONB;
    DECLARE update_diff JSONB;
    DECLARE primary_values JSONB;
    DECLARE old_row JSONB;
    DECLARE new_row JSONB;
BEGIN
    old_row := CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(old) ELSE NULL END;
    new_row := CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(new) ELSE NULL END;
    primary_values := (
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
    CASE WHEN NULLIF(current_setting('system.current_stage_id' || TG_TABLE_SCHEMA, TRUE), '') IS NULL THEN
        PERFORM set_config('system.current_stage_id' || TG_TABLE_SCHEMA, "id"::TEXT, TRUE), set_config('system.current_stage_event' || TG_TABLE_SCHEMA, "event_id"::TEXT, TRUE)
        FROM "stage"
        WHERE "slug" = right(TG_TABLE_SCHEMA, -length('stage_'))
            FOR NO KEY UPDATE;
        ELSE
        -- do nothing
        END CASE;
    previous_id := current_setting('system.current_stage_event' || TG_TABLE_SCHEMA)::UUID;
    INSERT INTO "event" ("id", "type", "data", "previous_id")
    VALUES (set_config('system.current_stage_event' || TG_TABLE_SCHEMA, system.uuid_generate_v4()::TEXT, TRUE)::UUID, new_event_type, new_event_data, previous_id);

    RETURN NULL;
END;

$$ LANGUAGE plpgsql`)
	builder.sql(`CREATE OR REPLACE FUNCTION "statement_trigger_event"() RETURNS TRIGGER AS
$$
BEGIN
    CASE
        WHEN NULLIF(current_setting('system.current_stage_id' || TG_TABLE_SCHEMA, TRUE), '') IS NOT NULL THEN
            UPDATE stage SET event_id = current_setting('system.current_stage_event' || TG_TABLE_SCHEMA)::UUID WHERE id = current_setting('system.current_stage_id' || TG_TABLE_SCHEMA)::UUID;
        ELSE
        -- do nothing
        END CASE;
    RETURN NULL;
END;
$$
    LANGUAGE plpgsql`)
	for (const table of junctionTables) {
		for (const schema of schemas) {
			createEventStatementTrigger(builder, { name: table.tableName, schema })
		}
	}
	for (const entity of Object.values(schema.model.entities)) {
		for (const schema of schemas) {
			createEventStatementTrigger(builder, { name: entity.tableName, schema })
		}
	}
}
