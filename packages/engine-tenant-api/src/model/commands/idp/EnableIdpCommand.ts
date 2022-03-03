import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'

export class EnableIdpCommand implements Command<void> {
	constructor(
		private id: string,
	) {
	}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('identity_provider')
			.values({
				disabled_at: null,
			})
			.where({
				id: this.id,
			})
			.execute(db)
	}
}
