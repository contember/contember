ALTER TABLE "system"."event"
	ADD COLUMN transaction_id uuid DEFAULT NULL;
UPDATE "system"."event"
SET transaction_id = "system".uuid_generate_v4();

ALTER TABLE "system"."event"
	ALTER "transaction_id" SET DEFAULT current_setting('system.transaction_id')::uuid,
	ALTER "transaction_id" SET NOT NULL;
