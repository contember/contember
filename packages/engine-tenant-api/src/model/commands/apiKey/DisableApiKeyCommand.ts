import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

export class DisableApiKeyCommand implements Command<boolean> {
	constructor(private readonly apiKeyId: string) {}

	async execute({ db }: Command.Args): Promise<boolean> {
		const qb = UpdateBuilder.create()
			.table('api_key')
			.where({
				id: this.apiKeyId,
			})
			.values({ disabled_at: new Date() })

		return (await qb.execute(db)) > 0
	}
}
