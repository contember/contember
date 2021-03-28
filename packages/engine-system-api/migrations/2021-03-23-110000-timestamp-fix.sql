ALTER TABLE "system"."schema_migration"
	ALTER "executed_at" TYPE TIMESTAMPTZ,
	ALTER "executed_at" SET DEFAULT now();

ALTER TABLE "system"."event"
	ALTER "created_at" TYPE TIMESTAMPTZ;
