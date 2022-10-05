import { MigrationBuilder } from '@contember/database-migrations'
import { TenantMigrationArgs } from './types'
import { createCredentials } from './tenantCredentials'

export default async function (builder: MigrationBuilder, args: TenantMigrationArgs) {
	builder.sql(`
CREATE TABLE "api_key" (
    "id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "type" "text" NOT NULL,
    "identity_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL,
    "expiration" integer,
    "disabled_at" timestamp with time zone
);
CREATE TABLE "identity" (
    "id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "roles" "jsonb" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone NOT NULL
);
CREATE TABLE "identity_provider" (
    "id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "type" "text" NOT NULL,
    "configuration" "jsonb" NOT NULL,
    "disabled_at" timestamp with time zone,
    "auto_sign_up" boolean DEFAULT false NOT NULL,
    "exclusive" boolean DEFAULT false
);
CREATE TABLE "mail_template" (
    "id" "uuid" NOT NULL,
    "project_id" "uuid",
    "mail_type" "text" NOT NULL,
    "variant" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "content" "text" NOT NULL,
    "use_layout" boolean NOT NULL
);
CREATE TABLE "person" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "password_hash" "text",
    "identity_id" "uuid" NOT NULL,
    "otp_uri" "text",
    "otp_activated_at" timestamp with time zone,
    "name" "text",
    "idp_only" boolean DEFAULT false NOT NULL,
    CONSTRAINT "idp_only_no_email" CHECK ((("idp_only" = false) OR (("idp_only" = true) AND ("email" IS NULL))))
);
CREATE TABLE "person_identity_provider" (
    "id" "uuid" NOT NULL,
    "person_id" "uuid" NOT NULL,
    "identity_provider_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "external_identifier" "text" NOT NULL
);
CREATE TABLE "person_password_reset" (
    "id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "person_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone
);
CREATE TABLE "project" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
CREATE TABLE "project_membership" (
    "id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "identity_id" "uuid" NOT NULL,
    "role" "text" NOT NULL
);
CREATE TABLE "project_membership_variable" (
    "id" "uuid" NOT NULL,
    "membership_id" "uuid" NOT NULL,
    "variable" "text" NOT NULL,
    "value" "jsonb" NOT NULL
);
CREATE TABLE "project_secret" (
    "id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "value" "bytea" NOT NULL,
    "version" smallint NOT NULL
);
ALTER TABLE ONLY "api_key"
    ADD CONSTRAINT "api_key_id" PRIMARY KEY ("id");
ALTER TABLE ONLY "person"
    ADD CONSTRAINT "email_unique" UNIQUE ("email");
ALTER TABLE ONLY "identity"
    ADD CONSTRAINT "identity_id" PRIMARY KEY ("id");
ALTER TABLE ONLY "identity_provider"
    ADD CONSTRAINT "identity_provider_id" PRIMARY KEY ("id");
ALTER TABLE ONLY "identity_provider"
    ADD CONSTRAINT "identity_provider_slug_key" UNIQUE ("slug");
ALTER TABLE ONLY "mail_template"
    ADD CONSTRAINT "mail_template_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "person"
    ADD CONSTRAINT "person_id" PRIMARY KEY ("id");
ALTER TABLE ONLY "person"
    ADD CONSTRAINT "person_identity_id_key" UNIQUE ("identity_id");
ALTER TABLE ONLY "person_identity_provider"
    ADD CONSTRAINT "person_identity_provider_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "person_password_reset"
    ADD CONSTRAINT "person_password_reset_id" PRIMARY KEY ("id");
ALTER TABLE ONLY "project"
    ADD CONSTRAINT "project_id" PRIMARY KEY ("id");
ALTER TABLE ONLY "project_membership"
    ADD CONSTRAINT "project_membership_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "project_membership_variable"
    ADD CONSTRAINT "project_membership_variable_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "project_membership_variable"
    ADD CONSTRAINT "project_membership_variable_unique" UNIQUE ("membership_id", "variable");
ALTER TABLE ONLY "project_secret"
    ADD CONSTRAINT "project_secret_pkey" PRIMARY KEY ("id");
CREATE INDEX "api_key_identity_id" ON "api_key" USING "btree" ("identity_id");
CREATE UNIQUE INDEX "api_key_token_hash" ON "api_key" USING "btree" ("token_hash");
CREATE INDEX "identity_parent_id" ON "identity" USING "btree" ("parent_id");
CREATE UNIQUE INDEX "mail_template_identifier" ON "mail_template" USING "btree" ("project_id", "mail_type", "variant") WHERE ("project_id" IS NOT NULL);
CREATE UNIQUE INDEX "mail_template_identifier_global" ON "mail_template" USING "btree" ("mail_type", "variant") WHERE ("project_id" IS NULL);
CREATE INDEX "mail_template_project_index" ON "mail_template" USING "btree" ("project_id");
CREATE INDEX "person_identity_id" ON "person" USING "btree" ("identity_id");
CREATE UNIQUE INDEX "person_identity_provider_identifier" ON "person_identity_provider" USING "btree" ("identity_provider_id", "external_identifier");
CREATE INDEX "person_identity_provider_person_id" ON "person_identity_provider" USING "btree" ("person_id");
CREATE UNIQUE INDEX "person_password_reset_token" ON "person_password_reset" USING "btree" ("token_hash");
CREATE INDEX "project_alias" ON "project" USING "gin" ((("config" -> 'alias'::"text")));
CREATE INDEX "project_membership_identity_index" ON "project_membership" USING "btree" ("identity_id");
CREATE UNIQUE INDEX "project_membership_unique" ON "project_membership" USING "btree" ("project_id", "identity_id", "role");
CREATE INDEX "project_secret_project_index" ON "project_secret" USING "btree" ("project_id");
CREATE UNIQUE INDEX "project_secret_unique" ON "project_secret" USING "btree" ("project_id", "key");
CREATE UNIQUE INDEX "project_slug" ON "project" USING "btree" ("slug");
ALTER TABLE ONLY "api_key"
    ADD CONSTRAINT "api_key_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "identity"("id");
ALTER TABLE ONLY "identity"
    ADD CONSTRAINT "identity_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "identity"("id");
ALTER TABLE ONLY "mail_template"
    ADD CONSTRAINT "mail_template_project" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "person"
    ADD CONSTRAINT "person_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "identity"("id");
ALTER TABLE ONLY "person_identity_provider"
    ADD CONSTRAINT "person_identity_provider_idp" FOREIGN KEY ("identity_provider_id") REFERENCES "identity_provider"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "person_identity_provider"
    ADD CONSTRAINT "person_identity_provider_person" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "person_password_reset"
    ADD CONSTRAINT "person_password_reset_person" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "project_membership"
    ADD CONSTRAINT "project_membership_identity" FOREIGN KEY ("identity_id") REFERENCES "identity"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "project_membership"
    ADD CONSTRAINT "project_membership_project" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "project_membership_variable"
    ADD CONSTRAINT "project_membership_variable_membership" FOREIGN KEY ("membership_id") REFERENCES "project_membership"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "project_secret"
    ADD CONSTRAINT "project_secret_project" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;
`)

	await createCredentials(builder, args)
}
