import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
    ALTER TABLE "config"
        ADD COLUMN "password_check_hibp" BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN "captcha_provider"    TEXT,
        ADD COLUMN "captcha_secret"      TEXT,
        ADD COLUMN "captcha_threshold"   DOUBLE PRECISION,
        ADD COLUMN "rate_limit_sign_up_per_ip_limit"                     INTEGER  NOT NULL DEFAULT 10,
        ADD COLUMN "rate_limit_sign_up_per_ip_window"                    INTERVAL NOT NULL DEFAULT '1 hour',
        ADD COLUMN "rate_limit_login_per_ip_limit"                       INTEGER  NOT NULL DEFAULT 60,
        ADD COLUMN "rate_limit_login_per_ip_window"                      INTERVAL NOT NULL DEFAULT '1 hour',
        ADD COLUMN "rate_limit_password_reset_per_ip_limit"              INTEGER  NOT NULL DEFAULT 20,
        ADD COLUMN "rate_limit_password_reset_per_ip_window"             INTERVAL NOT NULL DEFAULT '1 hour',
        ADD COLUMN "rate_limit_passwordless_init_per_ip_limit"           INTEGER  NOT NULL DEFAULT 20,
        ADD COLUMN "rate_limit_passwordless_init_per_ip_window"          INTERVAL NOT NULL DEFAULT '1 hour',
        ADD COLUMN "rate_limit_password_reset_mail_per_email_limit"      INTEGER  NOT NULL DEFAULT 5,
        ADD COLUMN "rate_limit_password_reset_mail_per_email_window"     INTERVAL NOT NULL DEFAULT '1 hour',
        ADD COLUMN "rate_limit_passwordless_init_mail_per_email_limit"   INTEGER  NOT NULL DEFAULT 5,
        ADD COLUMN "rate_limit_passwordless_init_mail_per_email_window"  INTERVAL NOT NULL DEFAULT '1 hour',
        ADD CONSTRAINT "config_captcha_provider_check"
            CHECK ("captcha_provider" IS NULL OR "captcha_provider" IN ('turnstile', 'hcaptcha', 'recaptchaV3')),
        ADD CONSTRAINT "config_captcha_complete"
            CHECK ("captcha_provider" IS NULL OR "captcha_secret" IS NOT NULL);

    CREATE TABLE "rate_limit_event" (
        "id"          UUID PRIMARY KEY,
        "scope"       TEXT        NOT NULL,
        "key_hash"    BYTEA       NOT NULL,
        "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX "rate_limit_event_lookup"
        ON "rate_limit_event" ("scope", "key_hash", "occurred_at" DESC);
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
