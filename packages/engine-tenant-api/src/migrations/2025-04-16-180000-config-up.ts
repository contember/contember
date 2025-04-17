import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "config"
	ADD COLUMN "password_min_length" INTEGER NOT NULL DEFAULT 8,
	ADD COLUMN "password_require_uppercase" INTEGER NOT NULL DEFAULT 1,
	ADD COLUMN "password_require_lowercase" INTEGER NOT NULL DEFAULT 1,
	ADD COLUMN "password_require_digit" INTEGER NOT NULL DEFAULT 1,
	ADD COLUMN "password_require_special" INTEGER NOT NULL DEFAULT 0,
	ADD COLUMN "password_pattern" TEXT DEFAULT NULL,
	ADD COLUMN "password_check_blacklist" BOOLEAN NOT NULL DEFAULT TRUE,
	ADD COLUMN "login_base_backoff_ms" INTEGER NOT NULL DEFAULT 1000,
	ADD COLUMN "login_max_backoff_ms" INTEGER NOT NULL DEFAULT 1000 * 60,
	ADD COLUMN "login_attempt_window_ms" INTEGER NOT NULL DEFAULT 1000 * 60 * 5,
	ADD COLUMN "login_reveal_user_exits" BOOLEAN NOT NULL DEFAULT TRUE,
	ADD COLUMN "login_default_token_expiration_minutes" INTEGER NOT NULL DEFAULT 30,
	ADD COLUMN "login_max_token_expiration_minutes" INTEGER DEFAULT 60 * 24 * 180; -- 6 months

-- revert defaults for existing projects
UPDATE "config"
SET password_min_length                = 6,
    password_require_uppercase         = 0,
    password_require_lowercase         = 0,
    password_require_digit             = 0,
    password_check_blacklist           = FALSE,
    login_max_token_expiration_minutes = NULL;
	                                                                              
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
