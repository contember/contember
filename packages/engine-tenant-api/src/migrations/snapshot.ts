import { MigrationBuilder } from '@contember/database-migrations'
import { TenantMigrationArgs } from './types'
import { createCredentials } from './tenantCredentials'

export default async function (builder: MigrationBuilder, args: TenantMigrationArgs) {
	builder.sql(`
CREATE TYPE "auth_log_type" AS ENUM (
    'login',
    'create_session_token',
    'idp_login',
    'password_reset_init',
    'password_reset',
    'password_change',
    'email_change',
    '2fa_disable',
    '2fa_enable',
    'passwordless_login_init',
    'passwordless_login_exchange',
    'passwordless_login',
    'person_disable'
);
CREATE TYPE "config_policy" AS ENUM (
    'always',
    'never',
    'optIn',
    'optOut'
);
CREATE TYPE "config_singleton" AS ENUM (
    'singleton'
);
CREATE TYPE "person_token_type" AS ENUM (
    'password_reset',
    'passwordless'
);
CREATE FUNCTION "project_deleted"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
	PERFORM pg_notify('project_updated', old.id::text);
	RETURN NULL;
END;
$$;
CREATE FUNCTION "project_secret_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
	UPDATE project SET updated_at = 'now' WHERE id = COALESCE(new.project_id, old.project_id);
	PERFORM pg_notify('project_updated', COALESCE(new.project_id, old.project_id)::TEXT);
	RETURN NULL;
END;
$$;
CREATE FUNCTION "project_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
	NEW.updated_at = 'now';
	PERFORM pg_notify('project_updated', new.id::text);
	RETURN new;
END;
$$;
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
CREATE TABLE "config" (
    "id" "config_singleton" DEFAULT 'singleton'::"config_singleton" NOT NULL,
    "passwordless_enabled" "config_policy" DEFAULT 'never'::"config_policy" NOT NULL,
    "passwordless_url" "text",
    "passwordless_expiration_minutes" integer DEFAULT 5 NOT NULL,
    "password_min_length" integer DEFAULT 8 NOT NULL,
    "password_require_uppercase" integer DEFAULT 1 NOT NULL,
    "password_require_lowercase" integer DEFAULT 1 NOT NULL,
    "password_require_digit" integer DEFAULT 1 NOT NULL,
    "password_require_special" integer DEFAULT 0 NOT NULL,
    "password_pattern" "text",
    "password_check_blacklist" boolean DEFAULT true NOT NULL,
    "login_base_backoff_ms" integer DEFAULT 1000 NOT NULL,
    "login_max_backoff_ms" integer DEFAULT (1000 * 60) NOT NULL,
    "login_attempt_window_ms" integer DEFAULT ((1000 * 60) * 5) NOT NULL,
    "login_reveal_user_exits" boolean DEFAULT true NOT NULL,
    "login_default_token_expiration_minutes" integer DEFAULT 30 NOT NULL,
    "login_max_token_expiration_minutes" integer DEFAULT ((60 * 24) * 180)
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
    "exclusive" boolean DEFAULT false,
    "init_returns_config" boolean DEFAULT false NOT NULL
);
CREATE TABLE "mail_template" (
    "id" "uuid" NOT NULL,
    "project_id" "uuid",
    "mail_type" "text" NOT NULL,
    "variant" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "content" "text" NOT NULL,
    "use_layout" boolean NOT NULL,
    "reply_to" "text"
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
    "disabled_at" timestamp with time zone,
    "passwordless_enabled" boolean,
    CONSTRAINT "idp_only_no_email" CHECK ((("idp_only" = false) OR (("idp_only" = true) AND ("email" IS NULL))))
);
CREATE TABLE "person_auth_log" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "invoked_by_id" "uuid",
    "person_id" "uuid",
    "person_token_id" "uuid",
    "person_input_identifier" "text",
    "type" "auth_log_type" NOT NULL,
    "success" boolean NOT NULL,
    "error_code" "text",
    "error_message" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "identity_provider_id" "uuid",
    "metadata" "jsonb"
);
CREATE TABLE "person_identity_provider" (
    "id" "uuid" NOT NULL,
    "person_id" "uuid" NOT NULL,
    "identity_provider_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "external_identifier" "text" NOT NULL
);
CREATE TABLE "person_token" (
    "id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "person_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "type" "person_token_type" DEFAULT 'password_reset'::"person_token_type" NOT NULL,
    "otp_hash" "text",
    "otp_attempts" integer DEFAULT 0 NOT NULL
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
ALTER TABLE ONLY "config"
    ADD CONSTRAINT "config_pkey" PRIMARY KEY ("id");
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
ALTER TABLE ONLY "person_auth_log"
    ADD CONSTRAINT "person_auth_log_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "person"
    ADD CONSTRAINT "person_id" PRIMARY KEY ("id");
ALTER TABLE ONLY "person"
    ADD CONSTRAINT "person_identity_id_key" UNIQUE ("identity_id");
ALTER TABLE ONLY "person_identity_provider"
    ADD CONSTRAINT "person_identity_provider_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "person_token"
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
CREATE INDEX "person_auth_log_person_input_identifier_created_at_idx" ON "person_auth_log" USING "btree" ("person_input_identifier", "created_at" DESC);
CREATE INDEX "person_identity_id" ON "person" USING "btree" ("identity_id");
CREATE UNIQUE INDEX "person_identity_provider_identifier" ON "person_identity_provider" USING "btree" ("identity_provider_id", "external_identifier");
CREATE INDEX "person_identity_provider_person_id" ON "person_identity_provider" USING "btree" ("person_id");
CREATE UNIQUE INDEX "person_password_reset_token" ON "person_token" USING "btree" ("token_hash");
CREATE INDEX "project_alias" ON "project" USING "gin" ((("config" -> 'alias'::"text")));
CREATE INDEX "project_membership_identity_index" ON "project_membership" USING "btree" ("identity_id");
CREATE UNIQUE INDEX "project_membership_unique" ON "project_membership" USING "btree" ("project_id", "identity_id", "role");
CREATE INDEX "project_secret_project_index" ON "project_secret" USING "btree" ("project_id");
CREATE UNIQUE INDEX "project_secret_unique" ON "project_secret" USING "btree" ("project_id", "key");
CREATE UNIQUE INDEX "project_slug" ON "project" USING "btree" ("slug");
CREATE TRIGGER "project_deleted" AFTER DELETE ON "project" FOR EACH ROW EXECUTE FUNCTION "project_deleted"();
CREATE TRIGGER "project_secret_updated" AFTER INSERT OR DELETE OR UPDATE ON "project_secret" FOR EACH ROW EXECUTE FUNCTION "project_secret_updated"();
CREATE TRIGGER "project_updated" BEFORE INSERT OR UPDATE OF "name", "slug", "config" ON "project" FOR EACH ROW EXECUTE FUNCTION "project_updated"();
ALTER TABLE ONLY "api_key"
    ADD CONSTRAINT "api_key_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "identity"("id");
ALTER TABLE ONLY "identity"
    ADD CONSTRAINT "identity_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "identity"("id");
ALTER TABLE ONLY "mail_template"
    ADD CONSTRAINT "mail_template_project" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "person_auth_log"
    ADD CONSTRAINT "person_auth_log_identity_provider_id_fkey" FOREIGN KEY ("identity_provider_id") REFERENCES "identity_provider"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "person_auth_log"
    ADD CONSTRAINT "person_auth_log_invoked_by_id_fkey" FOREIGN KEY ("invoked_by_id") REFERENCES "identity"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "person_auth_log"
    ADD CONSTRAINT "person_auth_log_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "person_auth_log"
    ADD CONSTRAINT "person_auth_log_person_token_id_fkey" FOREIGN KEY ("person_token_id") REFERENCES "person_token"("id") ON DELETE SET NULL;
ALTER TABLE ONLY "person"
    ADD CONSTRAINT "person_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "identity"("id");
ALTER TABLE ONLY "person_identity_provider"
    ADD CONSTRAINT "person_identity_provider_idp" FOREIGN KEY ("identity_provider_id") REFERENCES "identity_provider"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "person_identity_provider"
    ADD CONSTRAINT "person_identity_provider_person" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "person_token"
    ADD CONSTRAINT "person_password_reset_person" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "project_membership"
    ADD CONSTRAINT "project_membership_identity" FOREIGN KEY ("identity_id") REFERENCES "identity"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "project_membership"
    ADD CONSTRAINT "project_membership_project" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "project_membership_variable"
    ADD CONSTRAINT "project_membership_variable_membership" FOREIGN KEY ("membership_id") REFERENCES "project_membership"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "project_secret"
    ADD CONSTRAINT "project_secret_project" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE;
INSERT INTO "config" (id)
VALUES (DEFAULT);

DO LANGUAGE plpgsql
$$
	BEGIN
		EXECUTE FORMAT('ALTER FUNCTION project_secret_updated() SET SEARCH_PATH = %s', QUOTE_IDENT(CURRENT_SCHEMA()));
	END
$$;
`)

	await createCredentials(builder, args)
}
