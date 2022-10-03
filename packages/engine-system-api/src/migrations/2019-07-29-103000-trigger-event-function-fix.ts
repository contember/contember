import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE OR REPLACE FUNCTION "trigger_event"() RETURNS TRIGGER AS $$

  DECLARE new_event_id uuid := uuid_generate_v4();
  DECLARE new_event_type text;
  DECLARE new_event_data jsonb;
  DECLARE current_stage record;
  DECLARE update_diff jsonb;

  BEGIN
      CASE TG_OP
      WHEN 'INSERT' THEN
        new_event_type := 'create';
        new_event_data := jsonb_build_object(
          'tableName', TG_TABLE_NAME,
          'rowId', NEW.id::text,
          'values', to_jsonb(NEW) - 'id'
        );

      WHEN 'UPDATE' THEN
        update_diff := "make_diff"(to_jsonb(OLD), to_jsonb(NEW));
        IF (SELECT count(*) FROM jsonb_object_keys(update_diff)) = 0 THEN
            RETURN NULL;
        END IF;
        new_event_type := 'update';
        new_event_data := jsonb_build_object(
          'tableName', TG_TABLE_NAME,
          'rowId', OLD.id::text,
          'values', update_diff
        );

      WHEN 'DELETE' THEN
        new_event_type := 'delete';
        new_event_data := jsonb_build_object(
          'tableName', TG_TABLE_NAME,
          'rowId', OLD.id::text
        );

      ELSE
        RAISE EXCEPTION 'Unknown TG_OP value %', TG_OP;
    END CASE;

    SELECT "id", "event_id" FROM "stage"
    WHERE "slug" = right(TG_TABLE_SCHEMA, -length('stage_'))
    FOR NO KEY UPDATE
    INTO current_stage;

    INSERT INTO "event" ("id", "type", "data", "previous_id")
    VALUES (new_event_id, new_event_type, new_event_data, current_stage.event_id);

    UPDATE "stage"
    SET "event_id" = new_event_id
    WHERE "id" = current_stage.id;

    RETURN NULL;
  END;

$$ LANGUAGE plpgsql;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
