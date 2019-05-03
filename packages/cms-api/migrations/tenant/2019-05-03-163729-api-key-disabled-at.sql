ALTER TABLE "tenant"."api_key"
    ADD COLUMN "disabled_at" TIMESTAMP;

UPDATE "tenant"."api_key"
SET "disabled_at" = "created_at"
WHERE "enabled" = FALSE;

ALTER TABLE "tenant"."api_key"
    DROP COLUMN "enabled";
