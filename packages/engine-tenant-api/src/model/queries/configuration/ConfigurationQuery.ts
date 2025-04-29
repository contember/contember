import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { Config, ConfigRow } from '../../type/Config'

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
				expiration: result.passwordless_expiration,
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
				baseBackoff: result.login_base_backoff,
				maxBackoff: result.login_max_backoff,
				attemptWindow: result.login_attempt_window,
				revealUserExists: result.login_reveal_user_exits,
				defaultTokenExpiration: result.login_default_token_expiration,
				maxTokenExpiration: result.login_max_token_expiration,
			},
		}
	}
}

