import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "api_key"
	ADD COLUMN "last_ip" INET,
	ADD COLUMN "last_user_agent" TEXT,
	ADD COLUMN "last_used_at" TIMESTAMPTZ,
	ADD COLUMN "created_ip" INET,
	ADD COLUMN "created_user_agent" TEXT;

ALTER TYPE "auth_log_type" ADD VALUE 'session_revoked_by_user';
ALTER TYPE "auth_log_type" ADD VALUE 'forced_sign_out';

ALTER TABLE "person_auth_log"
	ADD COLUMN "target_person_id" UUID REFERENCES "person"("id") ON DELETE SET NULL;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
