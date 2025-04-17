import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { Config, ConfigPolicy } from '../../../schema'
import { ConfigRow } from '../../type/Config'

export class ConfigurationQuery extends DatabaseQuery<Config> {

	async fetch({ db }: DatabaseQueryable): Promise<Config> {
		const rows = await SelectBuilder.create<ConfigRow>()
			.from('config')
			.select(new Literal('*'))
			.getResult(db)
		const result = this.fetchOneOrNull(rows)
		if (!result) {
			throw new Error('Configuration not found')
		}

		return {
			passwordless: {
				enabled: result.passwordless_enabled,
				url: result.passwordless_url,
				expirationMinutes: result.passwordless_expiration_minutes,
			},
			password: {
				minLength: result.password_min_length,
				requireUppercase: result.password_require_uppercase,
				requireLowercase: result.password_require_lowercase,
				requireDigit: result.password_require_digit,
				requireSpecial: result.password_require_special,
				pattern: result.password_pattern,
				checkBlacklist: result.password_check_blacklist,
			},
			login: {
				baseBackoffMs: result.login_base_backoff_ms,
				maxBackoffMs: result.login_max_backoff_ms,
				attemptWindowMs: result.login_attempt_window_ms,
				revealUserExists: result.login_reveal_user_exits,
				defaultTokenExpirationMinutes: result.login_default_token_expiration_minutes,
				maxTokenExpirationMinutes: result.login_max_token_expiration_minutes,
			},
		}
	}
}

