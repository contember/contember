DO
$BLOCK$
    BEGIN
        IF NOT EXISTS(
          SELECT
          FROM pg_proc
                   JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
          WHERE pg_namespace.nspname = 'system' AND pg_proc.proname = 'uuid_generate_v4'
            ) THEN
            CREATE FUNCTION "system"."uuid_generate_v4"() RETURNS UUID
            AS
            $$
            SELECT OVERLAY(OVERLAY(md5(random()::TEXT || ':' || clock_timestamp()::TEXT) PLACING '4' FROM 13) PLACING
                           to_hex(floor(random() * (11 - 8 + 1) + 8)::INT)::TEXT FROM 17)::UUID;
            $$ LANGUAGE SQL;
            END IF;
    END
$BLOCK$;


CREATE FUNCTION "system"."make_diff"(old jsonb, new jsonb) RETURNS jsonb AS $$

  DECLARE col record;
  DECLARE diff jsonb := '{}'::jsonb;

  BEGIN
    FOR col IN SELECT n.key, n.value FROM jsonb_each(old) o, jsonb_each(new) n
               WHERE n.key = o.key AND n.value IS DISTINCT FROM o.value
    LOOP
      diff := diff || jsonb_build_object(col.key, col.value);
    END LOOP;

    RETURN diff;
  END;

$$ LANGUAGE  plpgsql;


CREATE FUNCTION "system"."trigger_event"() RETURNS TRIGGER AS $$

  DECLARE new_event_id uuid := system.uuid_generate_v4();
  DECLARE new_event_type text;
  DECLARE new_event_data jsonb;
  DECLARE current_stage record;

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
        new_event_type := 'update';
        new_event_data := jsonb_build_object(
          'tableName', TG_TABLE_NAME,
          'rowId', OLD.id::text,
          'values', "system"."make_diff"(to_jsonb(OLD), to_jsonb(NEW))
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

    SELECT "id", "event_id" FROM "system"."stage"
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
