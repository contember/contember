import { ConfigPolicy } from '../../schema'

export type ConfigRow = {
	passwordless_enabled: ConfigPolicy
	passwordless_url: string | null
	passwordless_expiration_minutes: number
	password_min_length: number
	password_require_uppercase: number
	password_require_lowercase: number
	password_require_digit: number
	password_require_special: number
	password_pattern: string | null
	password_check_blacklist: boolean
	login_base_backoff_ms: number
	login_max_backoff_ms: number
	login_attempt_window_ms: number
	login_reveal_user_exits: boolean
	login_default_token_expiration_minutes: number
	login_max_token_expiration_minutes: number | null
}
