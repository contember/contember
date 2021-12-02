ALTER TABLE "project"
	ADD COLUMN slug TEXT DEFAULT NULL;

UPDATE "project"
SET slug = name;

ALTER TABLE "project"
	ALTER slug DROP DEFAULT,
	ALTER slug SET NOT NULL;
