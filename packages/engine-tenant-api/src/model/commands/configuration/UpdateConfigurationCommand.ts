import { Command } from '../Command'
import { ConfigInput } from '../../../schema'
import { UpdateBuilder } from '@contember/database'

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
				passwordless_enabled: this.configuration.passwordless?.enabled,
				passwordless_url: this.configuration.passwordless?.url,
				passwordless_expiration_minutes: this.configuration.passwordless?.expirationMinutes,
			})
			.execute(db)
		if (!result) {
			throw new Error('Configuration not found')
		}
	}

}
