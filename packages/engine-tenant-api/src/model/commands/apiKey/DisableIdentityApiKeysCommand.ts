import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'

export class DisableIdentityApiKeysCommand implements Command<void> {
	constructor(private readonly identityId: string) {}

	async execute({ db }: Command.Args): Promise<void> {
		const qb = UpdateBuilder.create()
			.table('api_key')
			.where({
				identity_id: this.identityId,
			})
			.values({ disabled_at: new Date() })

		await qb.execute(db)
	}
}
