import migration from './2020-05-06-150000-composed-primary'
import { createMigrationBuilder } from '@contember/database-migrations'
import { exampleProject } from '@contember/engine-api-tester'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

test('many-has-many-primary migration sql', async () => {
	const builder = createMigrationBuilder()
	await migration(builder, {
		schemaResolver: () => Promise.resolve(exampleProject),
		project: {
			slug: 'test',
			stages: [
				{
					slug: 'prod',
					name: 'prod',
				},
				{
					slug: 'preview',
					name: 'preview',
				},
			],
		},
		queryHandler: null as any,
	})
	assert.equal(
		builder.getSql(),
		`ALTER TABLE "stage_prod"."post_tags"
  DROP "id";
ALTER TABLE "stage_prod"."post_tags" DROP CONSTRAINT "post_tags_uniq_post_id_tag_id";
ALTER TABLE "stage_prod"."post_tags"
  ADD CONSTRAINT "post_tags_pkey" PRIMARY KEY ("post_id", "tag_id");
DROP TRIGGER "log_event" ON "stage_prod"."post_tags";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_prod"."post_tags"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$post_id$pg1$, $pg1$tag_id$pg1$);
ALTER TABLE "stage_preview"."post_tags"
  DROP "id";
ALTER TABLE "stage_preview"."post_tags" DROP CONSTRAINT "post_tags_uniq_post_id_tag_id";
ALTER TABLE "stage_preview"."post_tags"
  ADD CONSTRAINT "post_tags_pkey" PRIMARY KEY ("post_id", "tag_id");
DROP TRIGGER "log_event" ON "stage_preview"."post_tags";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_preview"."post_tags"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$post_id$pg1$, $pg1$tag_id$pg1$);

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
						create_event.data -> 'values' ->> $pg1$post_id$pg1$,
						create_event.data -> 'values' ->> $pg1$tag_id$pg1$
					) AS id
				FROM recent_events AS create_event
				LEFT JOIN recent_events AS delete_event
					ON
						delete_event.data ->> 'rowId' = create_event.data ->> 'rowId'
						AND delete_event.type = 'delete'
						AND delete_event.data ->> 'tableName' = create_event.data ->> 'tableName'
				WHERE create_event.type = 'create' AND create_event.data ->> 'tableName' = $pg1$post_tags$pg1$
			)
		UPDATE event
		SET
			data = event.data || jsonb_build_object('rowId', affected_events.id)
		FROM affected_events
		WHERE
		      event.id = affected_events.create_id
		      OR event.id = affected_events.delete_id
		RETURNING event.data
;
DROP TRIGGER "log_event" ON "stage_prod"."author";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_prod"."author"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$id$pg1$);
DROP TRIGGER "log_event" ON "stage_preview"."author";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_preview"."author"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$id$pg1$);
DROP TRIGGER "log_event" ON "stage_prod"."author_contact";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_prod"."author_contact"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$id$pg1$);
DROP TRIGGER "log_event" ON "stage_preview"."author_contact";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_preview"."author_contact"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$id$pg1$);
DROP TRIGGER "log_event" ON "stage_prod"."post";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_prod"."post"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$id$pg1$);
DROP TRIGGER "log_event" ON "stage_preview"."post";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_preview"."post"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$id$pg1$);
DROP TRIGGER "log_event" ON "stage_prod"."tag";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_prod"."tag"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$id$pg1$);
DROP TRIGGER "log_event" ON "stage_preview"."tag";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_preview"."tag"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$id$pg1$);
DROP TRIGGER "log_event" ON "stage_prod"."entry";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_prod"."entry"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$id$pg1$);
DROP TRIGGER "log_event" ON "stage_preview"."entry";
CREATE TRIGGER "log_event"
  AFTER INSERT OR UPDATE OR DELETE ON "stage_preview"."entry"
  FOR EACH ROW
  EXECUTE PROCEDURE "system"."trigger_event"($pg1$id$pg1$);

		UPDATE system.event
		SET data = data || jsonb_build_object('rowId', json_build_array(data ->> 'rowId'))
		WHERE jsonb_typeof(data -> 'rowId') = 'string'
	;
CREATE OR REPLACE FUNCTION "system"."trigger_event"() RETURNS TRIGGER AS
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
;
DROP FUNCTION "system"."make_diff"("old" jsonb, "new" jsonb);
`,
	)
})

test.run()
