import { MigrationBuilder } from '@contember/database-migrations'

// Workload identity federation: a trust admits OIDC JWTs of one (issuer, audience) as its own identity.
// The trust's identity is marked by this table's unique `identity_id`, not by a column on `identity`:
// root credentials are inserted by `createCredentials`, whose SQL also runs in migrations that predate any new column.
const sql = `
CREATE TABLE "workload_identity_trust" (
	"id" uuid PRIMARY KEY,
	"slug" text NOT NULL,
	"identity_id" uuid NOT NULL REFERENCES "identity"("id") ON DELETE RESTRICT,
	"issuer" text NOT NULL,
	"audience" text NOT NULL,
	"profile" text NOT NULL CHECK ("profile" IN ('oidc', 'github-actions')),
	"jwks_uri" text,
	"signing_algs" text[] NOT NULL,
	"accepted_typ" text[] NOT NULL,
	"accept_audience_array" boolean NOT NULL DEFAULT false,
	"require_dpop" boolean NOT NULL DEFAULT false,
	"conditions" jsonb NOT NULL,
	"max_token_lifetime_seconds" integer NOT NULL CHECK ("max_token_lifetime_seconds" > 0 AND "max_token_lifetime_seconds" <= 86400),
	"tokens_valid_after" timestamp with time zone NOT NULL DEFAULT now(),
	"trust_forwarded_info" boolean NOT NULL DEFAULT false,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"created_by" uuid REFERENCES "identity"("id") ON DELETE SET NULL,
	"updated_at" timestamp with time zone NOT NULL DEFAULT now(),
	CONSTRAINT "workload_identity_trust_slug_key" UNIQUE ("slug"),
	CONSTRAINT "workload_identity_trust_identity_id_key" UNIQUE ("identity_id")
);

-- Partial, so a slug rename (disable + create with the same audience) and a re-creation after a tombstone still work.
CREATE UNIQUE INDEX "workload_identity_trust_enabled_issuer_audience_idx"
	ON "workload_identity_trust" ("issuer", "audience") WHERE "disabled_at" IS NULL;

CREATE TABLE "workload_identity_assume_rule" (
	"id" uuid PRIMARY KEY,
	"trust_id" uuid NOT NULL REFERENCES "workload_identity_trust"("id") ON DELETE CASCADE,
	"membership_id" uuid NOT NULL REFERENCES "project_membership"("id") ON DELETE CASCADE,
	"rule" jsonb NOT NULL,
	CONSTRAINT "workload_identity_assume_rule_membership_id_key" UNIQUE ("membership_id")
);
CREATE INDEX "workload_identity_assume_rule_trust_id_idx" ON "workload_identity_assume_rule" ("trust_id");

ALTER TABLE "person_auth_log"
	ADD COLUMN "trust_id" uuid REFERENCES "workload_identity_trust"("id") ON DELETE SET NULL,
	ADD COLUMN "token_ref" text;

-- One success row per token across a fleet: the first sighting inserts, every later one is ignored.
CREATE UNIQUE INDEX "person_auth_log_workload_token_ref_idx"
	ON "person_auth_log" ("trust_id", "token_ref") WHERE "success" AND "token_ref" IS NOT NULL;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
