import { Command } from '../Command'
import { ConfigInput } from '../../../schema'
import { UpdateBuilder } from '@contember/database'
import { ConfigRow } from '../../type/Config'
import { IPostgresInterval } from 'postgres-interval'

export class UpdateConfigurationCommand implements Command<void> {
	constructor(
		private readonly configuration: ConfigInput,
	) {
	}

	async execute({ db }: Command.Args): Promise<void> {
		const captcha = this.configuration.captcha
		const rl = this.configuration.rateLimits

		const result = await UpdateBuilder.create()
			.table('config')
			.where({ id: 'singleton' })
			.values(
				{
					passwordless_enabled: this.configuration.passwordless?.enabled ?? undefined,
					passwordless_url: this.configuration.passwordless?.url,
					passwordless_expiration: this.configuration.passwordless?.expiration ?? undefined,
					password_min_length: this.configuration.password?.minLength ?? undefined,
					password_require_uppercase: this.configuration.password?.requireUppercase ?? undefined,
					password_require_lowercase: this.configuration.password?.requireLowercase ?? undefined,
					password_require_digit: this.configuration.password?.requireDigit ?? undefined,
					password_require_special: this.configuration.password?.requireSpecial ?? undefined,
					password_pattern: this.configuration.password?.pattern,
					password_check_blacklist: this.configuration.password?.checkBlacklist ?? undefined,
					password_check_hibp: this.configuration.password?.checkHibp ?? undefined,
					login_base_backoff: this.configuration.login?.baseBackoff ?? undefined,
					login_max_backoff: this.configuration.login?.maxBackoff ?? undefined,
					login_attempt_window: this.configuration.login?.attemptWindow ?? undefined,
					login_reveal_user_exits: this.configuration.login?.revealUserExists ?? undefined,
					login_default_token_expiration: this.configuration.login?.defaultTokenExpiration ?? undefined,
					login_max_token_expiration: this.configuration.login?.maxTokenExpiration,
					captcha_provider: captcha?.provider !== undefined ? captcha.provider : undefined,
					captcha_secret: captcha?.secret !== undefined ? (captcha.secret === '' ? null : captcha.secret) : undefined,
					captcha_threshold: captcha?.threshold !== undefined ? captcha.threshold : undefined,
					rate_limit_sign_up_per_ip_limit: rl?.signUpPerIp?.limit ?? undefined,
					rate_limit_sign_up_per_ip_window: rl?.signUpPerIp?.window ?? undefined,
					rate_limit_password_reset_per_ip_limit: rl?.passwordResetPerIp?.limit ?? undefined,
					rate_limit_password_reset_per_ip_window: rl?.passwordResetPerIp?.window ?? undefined,
					rate_limit_passwordless_init_per_ip_limit: rl?.passwordlessInitPerIp?.limit ?? undefined,
					rate_limit_passwordless_init_per_ip_window: rl?.passwordlessInitPerIp?.window ?? undefined,
					rate_limit_password_reset_mail_per_email_limit: rl?.passwordResetMailPerEmail?.limit ?? undefined,
					rate_limit_password_reset_mail_per_email_window: rl?.passwordResetMailPerEmail?.window ?? undefined,
					rate_limit_passwordless_init_mail_per_email_limit: rl?.passwordlessInitMailPerEmail?.limit ?? undefined,
					rate_limit_passwordless_init_mail_per_email_window: rl?.passwordlessInitMailPerEmail?.window ?? undefined,
				} satisfies {
					[K in keyof ConfigRow]: (IPostgresInterval extends ConfigRow[K] ? string : never) | Exclude<ConfigRow[K], IPostgresInterval> | undefined
				},
			)
			.execute(db)
		if (!result) {
			throw new Error('Configuration not found')
		}
	}
}
