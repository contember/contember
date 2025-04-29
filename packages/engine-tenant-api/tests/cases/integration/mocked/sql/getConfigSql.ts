import { ExpectedQuery } from '@contember/database-tester/src'
import PostgresInterval from 'postgres-interval'
export const getConfigSql = (): ExpectedQuery => ({
	sql: `select *  from "tenant"."config"`,
	parameters: [],
	response: {
		rows: [
			{
				id: 'b65949a6-b481-40b5-a0ed-0acdb5a24cb6',
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
				login_base_backoff: PostgresInterval('00:00:01'),
				login_max_backoff: PostgresInterval('00:01:00'),
				login_attempt_window: PostgresInterval('00:05:00'),
				login_reveal_user_exits: true,
				login_default_token_expiration: PostgresInterval('00:30:00'),
				login_max_token_expiration: PostgresInterval('12:00:00'),
			},
		],
	},
})
