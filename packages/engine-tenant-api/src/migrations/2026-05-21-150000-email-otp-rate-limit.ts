import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
    ALTER TABLE "config"
        -- Unlike the per-IP throttles above (which default to 0 = opt-in), the
        -- email-OTP limiter ships ON with a generous default. It is a brute-force
        -- / email-bomb backstop for a second factor, keyed by person: a legitimate
        -- user never requests 10 codes in 10 minutes, so the default does not change
        -- behavior for real users, but it caps an attacker (who already knows the
        -- password) from re-issuing codes to reset the per-code 3-attempt counter.
        -- Set limit = 0 to disable.
        ADD COLUMN "rate_limit_email_otp_per_person_limit"   INTEGER  NOT NULL DEFAULT 10,
        ADD COLUMN "rate_limit_email_otp_per_person_window"  INTERVAL NOT NULL DEFAULT '10 minutes';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
