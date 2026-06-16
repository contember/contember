import { ExpectedQuery } from '@contember/database-tester'
import PostgresInterval from 'postgres-interval'
export const getConfigSql = (overrides: Record<string, unknown> = {}): ExpectedQuery => ({
	sql: `select *  from "tenant"."config"`,
	parameters: [],
	response: {
		rows: [
			{
				id: 'b65949a6-b481-40b5-a0ed-0acdb5a24cb6',
				signup_require_email_verification: false,
				// Both verification flags default to the feature-off state, matching
				// the real DB column defaults (DEFAULT FALSE). Tests that exercise a
				// verification flow opt in explicitly via an override.
				require_email_change_verification: false,
				passwordless_enabled: 'never',
				passwordless_url: null,
				passwordless_expiration: PostgresInterval('00:10:00'),
				password_min_length: 6,
				password_require_uppercase: 1,
				password_require_lowercase: 1,
				password_require_digit: 1,
				password_require_special: 0,
				password_pattern: null,
				password_check_blacklist: true,
				password_check_hibp: false,
				login_base_backoff: PostgresInterval('00:00:01'),
				login_max_backoff: PostgresInterval('00:01:00'),
				login_attempt_window: PostgresInterval('00:05:00'),
				login_reveal_user_exits: true,
				login_reveal_login_method: true,
				login_default_token_expiration: PostgresInterval('00:30:00'),
				login_max_token_expiration: PostgresInterval('12:00:00'),
				login_mfa_grace_duration: PostgresInterval('00:00:00'),
				// A03 anomaly detection — feature-off defaults (matches column defaults).
				// Tests that exercise the feature override these explicitly.
				login_anomaly_detection_enabled: false,
				login_anomaly_history_size: 10,
				login_anomaly_email_threshold: 1,
				login_anomaly_step_up_threshold: 3,
				captcha_provider: null,
				captcha_secret: null,
				captcha_secret_version: null,
				captcha_threshold: null,
				rate_limit_sign_up_per_ip_limit: 0,
				rate_limit_sign_up_per_ip_window: PostgresInterval('01:00:00'),
				rate_limit_login_per_ip_limit: 0,
				rate_limit_login_per_ip_window: PostgresInterval('01:00:00'),
				rate_limit_password_reset_per_ip_limit: 0,
				rate_limit_password_reset_per_ip_window: PostgresInterval('01:00:00'),
				rate_limit_passwordless_init_per_ip_limit: 0,
				rate_limit_passwordless_init_per_ip_window: PostgresInterval('01:00:00'),
				rate_limit_email_otp_per_person_limit: 10,
				rate_limit_email_otp_per_person_window: PostgresInterval('00:10:00'),
				rate_limit_email_verification_per_ip_limit: 0,
				rate_limit_email_verification_per_ip_window: PostgresInterval('01:00:00'),
				// Per-flow captcha enforcement. The historically-protected flows
				// default ON; email verification is opt-in (matches column defaults).
				captcha_protect_sign_up: true,
				captcha_protect_password_reset: true,
				captcha_protect_passwordless_init: true,
				captcha_protect_email_verification: false,
				...overrides,
			},
		],
	},
})
