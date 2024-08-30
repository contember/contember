import { DatabaseQuery, DatabaseQueryable, Literal, SelectBuilder } from '@contember/database'
import { Config, ConfigPolicy } from '../../../schema'

export class ConfigurationQuery extends DatabaseQuery<Config> {

	async fetch({ db }: DatabaseQueryable): Promise<Config> {
		const rows = await SelectBuilder.create<ConfigurationRow>()
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
		}
	}
}

interface ConfigurationRow {
	passwordless_enabled: ConfigPolicy
	passwordless_url: string | null
	passwordless_expiration_minutes: number
}
