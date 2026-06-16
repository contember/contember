import { MigrationBuilder } from '@contember/database-migrations'

// A03 — anomaly detection on sign-in. Additive and opt-in: every new config
// column ships with a feature-off default, so upgrading the engine alone never
// changes login behaviour. The two new auth_log_type values are wired by their
// call sites in this same change (LoginRiskAnalyzer / SignInManager).
const sql = `
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'unusual_login_detected';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'step_up_required';

-- Per-sign-in risk inputs persisted alongside every login attempt. Nullable:
-- geo_country is only populated when a trusted reverse-proxy geo header is
-- present, device_fingerprint is a hash of the user-agent (never the raw UA in
-- a second column). Both feed the next sign-in's history comparison.
ALTER TABLE "person_auth_log"
	ADD COLUMN "geo_country" TEXT,
	ADD COLUMN "device_fingerprint" TEXT;

-- Anomaly-detection policy (opt-in, default disabled). Thresholds compare the
-- current sign-in's cumulative risk score against the last N successful logins.
ALTER TABLE "config"
	ADD COLUMN "login_anomaly_detection_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
	-- How many recent successful logins to compare against (the "known" set).
	ADD COLUMN "login_anomaly_history_size" INTEGER NOT NULL DEFAULT 10,
	-- Score >= email threshold sends an UNUSUAL_LOGIN email; score >= step-up
	-- threshold additionally forces a second factor. 0 thresholds combined with
	-- the disabled flag keep the feature inert until explicitly turned on.
	ADD COLUMN "login_anomaly_email_threshold" INTEGER NOT NULL DEFAULT 1,
	ADD COLUMN "login_anomaly_step_up_threshold" INTEGER NOT NULL DEFAULT 3;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
