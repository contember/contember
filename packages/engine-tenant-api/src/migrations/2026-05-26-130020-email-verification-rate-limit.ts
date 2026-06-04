import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
-- Per-IP rate limit for requestEmailVerification, mirroring the existing
-- password-reset / passwordless-init limits. requestEmailVerification is an
-- unauthenticated, email-sending endpoint of the same class as password reset,
-- so it gets its own budget rather than sharing one. Defaults to limit 0, which
-- the RateLimiter treats as "disabled" — an engine upgrade therefore adds no
-- throttling until an operator configures emailVerificationPerIp.
ALTER TABLE "config"
	ADD COLUMN "rate_limit_email_verification_per_ip_limit"  INTEGER  NOT NULL DEFAULT 0,
	ADD COLUMN "rate_limit_email_verification_per_ip_window" INTERVAL NOT NULL DEFAULT '1 hour';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
