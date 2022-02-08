ALTER TABLE "schema_migration"
	ALTER "executed_at" TYPE TIMESTAMPTZ,
	ALTER "executed_at" SET DEFAULT now();

ALTER TABLE "event"
	ALTER "created_at" TYPE TIMESTAMPTZ;
