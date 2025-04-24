import { ConfigPolicy } from '../../schema'
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
	login_base_backoff: IPostgresInterval
	login_max_backoff: IPostgresInterval
	login_attempt_window: IPostgresInterval
	login_reveal_user_exits: boolean
	login_default_token_expiration: IPostgresInterval
	login_max_token_expiration: IPostgresInterval | null
}


export type Config = Omit<{
	[K in keyof ConfigSchema]: {
		[K2 in keyof ConfigSchema[K]]: Exclude<ConfigSchema[K][K2], Interval>
	}
}, '__typename'>
