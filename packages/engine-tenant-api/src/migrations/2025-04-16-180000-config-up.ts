import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
    ALTER TABLE "config"
        ADD COLUMN "password_min_length"            INTEGER  NOT NULL DEFAULT 8,
        ADD COLUMN "password_require_uppercase"     INTEGER  NOT NULL DEFAULT 1,
        ADD COLUMN "password_require_lowercase"     INTEGER  NOT NULL DEFAULT 1,
        ADD COLUMN "password_require_digit"         INTEGER  NOT NULL DEFAULT 1,
        ADD COLUMN "password_require_special"       INTEGER  NOT NULL DEFAULT 0,
        ADD COLUMN "password_pattern"               TEXT     DEFAULT NULL,
        ADD COLUMN "password_check_blacklist"       BOOLEAN  NOT NULL DEFAULT TRUE,
        ADD COLUMN "login_base_backoff"             INTERVAL NOT NULL DEFAULT '1 second',
        ADD COLUMN "login_max_backoff"              INTERVAL NOT NULL DEFAULT '60 second',
        ADD COLUMN "login_attempt_window"           INTERVAL NOT NULL DEFAULT '5 minute',
        ADD COLUMN "login_reveal_user_exits"        BOOLEAN  NOT NULL DEFAULT TRUE,
        ADD COLUMN "login_default_token_expiration" INTERVAL NOT NULL DEFAULT '30 minute',
        ADD COLUMN "login_max_token_expiration"     INTERVAL DEFAULT '6 month';
    ALTER TABLE "config"
        RENAME passwordless_expiration_minutes TO passwordless_expiration;

    ALTER TABLE "config"
        ALTER COLUMN passwordless_expiration DROP DEFAULT,
        ALTER COLUMN passwordless_expiration TYPE INTERVAL USING passwordless_expiration * INTERVAL '1 minute',
        ALTER COLUMN passwordless_expiration SET DEFAULT INTERVAL '5 minute';

-- revert defaults for existing projects
    UPDATE "config"
    SET password_min_length        = 6,
        password_require_uppercase = 0,
        password_require_lowercase = 0,
        password_require_digit     = 0,
        password_check_blacklist   = FALSE,
        login_max_token_expiration = NULL;

`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
