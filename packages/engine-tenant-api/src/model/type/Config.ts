import { CaptchaProvider, ConfigPolicy } from '../../schema'
import { IPostgresInterval } from 'postgres-interval'
import { type Config as ConfigSchema } from '../../schema'
import { Interval } from '../../schema/types'
export type ConfigRow = {
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
	login_default_token_expiration: IPostgresInterval
	login_max_token_expiration: IPostgresInterval | null
	captcha_provider: CaptchaProvider | null
	captcha_secret: string | null
	captcha_threshold: number | null
	rate_limit_sign_up_per_ip_limit: number
	rate_limit_sign_up_per_ip_window: IPostgresInterval
	rate_limit_login_per_ip_limit: number
	rate_limit_login_per_ip_window: IPostgresInterval
	rate_limit_password_reset_per_ip_limit: number
	rate_limit_password_reset_per_ip_window: IPostgresInterval
	rate_limit_passwordless_init_per_ip_limit: number
	rate_limit_passwordless_init_per_ip_window: IPostgresInterval
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
