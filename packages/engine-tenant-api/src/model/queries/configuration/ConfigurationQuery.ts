import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { Config, ConfigRow } from '../../type/Config'
import { Providers } from '../../providers'

export class ConfigurationQuery extends DatabaseQuery<Config> {
	constructor(private readonly providers: Providers) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<Config> {
		const rows = await SelectBuilder.create<ConfigRow>()
			.from('config')
			.select(new Literal('*'))
			.getResult(db)
		const result = this.fetchOneOrNull(rows)
		if (!result) {
			throw new Error('Configuration not found')
		}

		const captchaSecret = result.captcha_secret && typeof result.captcha_secret_version === 'number'
			? (await this.providers.decrypt(result.captcha_secret, result.captcha_secret_version)).value.toString('utf8')
			: null

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
				checkHibp: result.password_check_hibp,
			},
			login: {
				baseBackoff: result.login_base_backoff,
				maxBackoff: result.login_max_backoff,
				attemptWindow: result.login_attempt_window,
				revealUserExists: result.login_reveal_user_exits,
				revealLoginMethod: result.login_reveal_login_method,
				defaultTokenExpiration: result.login_default_token_expiration,
				maxTokenExpiration: result.login_max_token_expiration,
				mfaGraceDuration: result.login_mfa_grace_duration,
			},
			captcha: {
				provider: result.captcha_provider,
				threshold: result.captcha_threshold,
			},
			captchaSecret,
			rateLimits: {
				signUpPerIp: {
					limit: result.rate_limit_sign_up_per_ip_limit,
					window: result.rate_limit_sign_up_per_ip_window,
				},
				loginPerIp: {
					limit: result.rate_limit_login_per_ip_limit,
					window: result.rate_limit_login_per_ip_window,
				},
				passwordResetPerIp: {
					limit: result.rate_limit_password_reset_per_ip_limit,
					window: result.rate_limit_password_reset_per_ip_window,
				},
				passwordlessInitPerIp: {
					limit: result.rate_limit_passwordless_init_per_ip_limit,
					window: result.rate_limit_passwordless_init_per_ip_window,
				},
			},
		}
	}
}
