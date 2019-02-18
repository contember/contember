ALTER TABLE "tenant"."project"
	ADD COLUMN slug TEXT DEFAULT NULL;

UPDATE "tenant"."project"
SET slug = name;

ALTER TABLE "tenant"."project"
	ALTER slug DROP DEFAULT,
	ALTER slug SET NOT NULL;
