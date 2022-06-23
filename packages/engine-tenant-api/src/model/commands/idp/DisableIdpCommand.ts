import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

export class DisableIdpCommand implements Command<void> {
	constructor(
		private id: string,
	) {
	}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('identity_provider')
			.values({
				disabled_at: providers.now(),
			})
			.where({
				id: this.id,
			})
			.execute(db)
	}
}
