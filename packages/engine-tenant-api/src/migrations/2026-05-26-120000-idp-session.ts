import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TABLE "idp_session" (
	"id"                   UUID        NOT NULL PRIMARY KEY,
	"api_key_id"           UUID        NOT NULL,
	"identity_provider_id" UUID        NOT NULL,
	"idp_session_id"       TEXT,
	"tokens"               BYTEA,
	"tokens_version"       INT,
	"idp_expires_at"       TIMESTAMPTZ,
	"token_obtained_at"    TIMESTAMPTZ,
	"last_validated_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
	"created_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT "idp_session_api_key" FOREIGN KEY ("api_key_id")
		REFERENCES "api_key" ("id") ON DELETE CASCADE,
	CONSTRAINT "idp_session_idp" FOREIGN KEY ("identity_provider_id")
		REFERENCES "identity_provider" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "idp_session_api_key_id" ON "idp_session" ("api_key_id");
CREATE INDEX "idp_session_sid" ON "idp_session" ("identity_provider_id", "idp_session_id");

ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'idp_session_revalidated';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'idp_session_revoked';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
