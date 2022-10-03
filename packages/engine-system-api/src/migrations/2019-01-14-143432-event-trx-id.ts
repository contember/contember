import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "event"
	ADD COLUMN transaction_id uuid DEFAULT NULL;
UPDATE "event"
SET transaction_id = uuid_generate_v4();

ALTER TABLE "event"
	ALTER "transaction_id" SET DEFAULT current_setting('system.transaction_id')::uuid,
	ALTER "transaction_id" SET NOT NULL;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
