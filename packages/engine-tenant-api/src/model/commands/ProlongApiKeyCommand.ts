import { Command } from './Command'
import { ApiKey } from '../type'
import { ApiKeyHelper } from './ApiKeyHelper'
import { UpdateBuilder } from '@contember/database'

export class ProlongApiKeyCommand implements Command<void> {
	constructor(private readonly id: string, private readonly type: ApiKey.Type, private readonly expiration?: number) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const newExpiration = ApiKeyHelper.getExpiration(providers, this.type, this.expiration)
		if (newExpiration === null) {
			return
		}
		const qb = UpdateBuilder.create() //
			.table('api_key')
			.where({ id: this.id })
			.values({
				expires_at: newExpiration,
			})
		await qb.execute(db)
	}
}
