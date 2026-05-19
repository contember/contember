import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TABLE "tenant_policy" (
    "id"          UUID PRIMARY KEY,
    "slug"        TEXT NOT NULL UNIQUE,
    "label"       TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "document"    JSONB NOT NULL,
    "version"     INTEGER NOT NULL DEFAULT 1,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "identity_policy" (
    "identity_id" UUID NOT NULL REFERENCES "identity"("id") ON DELETE CASCADE,
    "policy_id"   UUID NOT NULL REFERENCES "tenant_policy"("id") ON DELETE CASCADE,
    "tags"        JSONB NOT NULL DEFAULT '{}'::jsonb,
    "granted_by"  UUID REFERENCES "identity"("id") ON DELETE SET NULL,
    "granted_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY ("identity_id", "policy_id")
);

CREATE INDEX ON "identity_policy" ("policy_id");
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
