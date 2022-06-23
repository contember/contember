import { Command } from '../Command.js'
import { ApiKey } from '../../type/index.js'
import { UpdateBuilder } from '@contember/database'

export class DisableOneOffApiKeyCommand implements Command<void> {
	constructor(private readonly apiKeyId: string) {}

	async execute({ db }: Command.Args): Promise<void> {
		const qb = UpdateBuilder.create()
			.table('api_key')
			.where({
				id: this.apiKeyId,
				type: ApiKey.Type.ONE_OFF,
			})
			.values({ disabled_at: new Date() })

		await qb.execute(db)
	}
}
