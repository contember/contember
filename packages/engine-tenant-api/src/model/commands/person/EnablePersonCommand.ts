import { Command } from '../Command.js'
import { UpdateBuilder } from '@contember/database'

export class EnablePersonCommand implements Command<void> {
	constructor(private readonly personId: string) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person')
			.values({
				disabled_at: null,
			})
			.where({
				id: this.personId,
			})
			.execute(db)
	}
}
