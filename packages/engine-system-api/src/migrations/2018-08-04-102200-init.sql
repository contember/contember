CREATE DOMAIN "event_type" AS TEXT CHECK (
  VALUE IN ('init', 'create', 'update', 'delete', 'run_migration')
);

CREATE TABLE "system"."event" (
  "id" uuid PRIMARY KEY NOT NULL,
  "type" event_type NOT NULL,
  "data" jsonb NOT NULL,
  "previous_id" uuid DEFAULT NULL REFERENCES "system"."event"("id") ON DELETE RESTRICT,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "identity_id" uuid NOT NULL DEFAULT current_setting('tenant.identity_id')::uuid,
  CONSTRAINT "previous_id_not_null" CHECK ("previous_id" IS NOT NULL OR "type" = 'init'),
  CONSTRAINT "unique_init" EXCLUDE ("type" WITH =) WHERE ("type" = 'init')
);
CREATE INDEX "system_event_type" ON "system"."event" USING HASH ("type"); -- TODO: Does this make sense?
CREATE INDEX "system_event_previous_id" ON "system"."event"("previous_id");
CREATE INDEX "system_event_data_table_name" ON "system"."event"(("data"->>'tableName'))
  WHERE "type" IN ('create', 'update', 'delete');
CREATE INDEX "system_event_data_row_id" ON "system"."event"(("data"->>'rowId'))
  WHERE "type" IN ('create', 'update', 'delete');

CREATE TABLE "system"."stage" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "event_id" uuid NOT NULL REFERENCES "system"."event"("id") ON DELETE RESTRICT
);
CREATE INDEX "system_stage_event_id" ON "system"."stage"("event_id");
