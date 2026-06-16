import { CaptchaProvider, ConfigPolicy } from '../../schema/index.js'
import { IPostgresInterval } from 'postgres-interval'
import { type Config as ConfigSchema } from '../../schema/index.js'
import { Interval } from '../../schema/types.js'
export type ConfigRow = {
	signup_require_email_verification: boolean
	require_email_change_verification: boolean
	passwordless_enabled: ConfigPolicy
	passwordless_url: string | null
	passwordless_expiration: IPostgresInterval
	password_min_length: number
	password_require_uppercase: number
	password_require_lowercase: number
	password_require_digit: number
	password_require_special: number
	password_pattern: string | null
	password_check_blacklist: boolean
	password_check_hibp: boolean
	login_base_backoff: IPostgresInterval
	login_max_backoff: IPostgresInterval
	login_attempt_window: IPostgresInterval
	login_reveal_user_exits: boolean
	login_reveal_login_method: boolean
	login_default_token_expiration: IPostgresInterval
	login_max_token_expiration: IPostgresInterval | null
	login_mfa_grace_duration: IPostgresInterval
	login_anomaly_detection_enabled: boolean
	login_anomaly_history_size: number
	login_anomaly_email_threshold: number
	login_anomaly_step_up_threshold: number
	captcha_provider: CaptchaProvider | null
	captcha_secret: Buffer | null
	captcha_secret_version: number | null
	captcha_threshold: number | null
	captcha_protect_sign_up: boolean
	captcha_protect_password_reset: boolean
	captcha_protect_passwordless_init: boolean
	captcha_protect_email_verification: boolean
	rate_limit_sign_up_per_ip_limit: number
	rate_limit_sign_up_per_ip_window: IPostgresInterval
	rate_limit_login_per_ip_limit: number
	rate_limit_login_per_ip_window: IPostgresInterval
	rate_limit_password_reset_per_ip_limit: number
	rate_limit_password_reset_per_ip_window: IPostgresInterval
	rate_limit_passwordless_init_per_ip_limit: number
	rate_limit_passwordless_init_per_ip_window: IPostgresInterval
	rate_limit_email_otp_per_person_limit: number
	rate_limit_email_otp_per_person_window: IPostgresInterval
	rate_limit_email_verification_per_ip_limit: number
	rate_limit_email_verification_per_ip_window: IPostgresInterval
}

export type Config =
	& Omit<
		{
			[K in keyof ConfigSchema]: {
				[K2 in keyof ConfigSchema[K]]: Exclude<ConfigSchema[K][K2], Interval>
			}
		},
		'__typename'
	>
	& {
		/**
		 * Decrypted/plaintext captcha secret. Never exposed through the GraphQL
		 * schema — only the runtime validator reads it.
		 */
		readonly captchaSecret: string | null
	}
