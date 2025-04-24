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

		const result = await UpdateBuilder.create()
			.table('config')
			.where({ id: 'singleton' })
			.values({
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
				login_base_backoff: this.configuration.login?.baseBackoff ?? undefined,
				login_max_backoff: this.configuration.login?.maxBackoff ?? undefined,
				login_attempt_window: this.configuration.login?.attemptWindow ?? undefined,
				login_reveal_user_exits: this.configuration.login?.revealUserExists ?? undefined,
				login_default_token_expiration: this.configuration.login?.defaultTokenExpiration ?? undefined,
				login_max_token_expiration: this.configuration.login?.maxTokenExpiration,
			} satisfies {
				[K in keyof ConfigRow]: (IPostgresInterval extends ConfigRow[K] ? string : never) | Exclude<ConfigRow[K], IPostgresInterval> | undefined
			})
			.execute(db)
		if (!result) {
			throw new Error('Configuration not found')
		}
	}

}
