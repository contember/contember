import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'

export class DisablePersonCommand implements Command<void> {
	constructor(private readonly personId: string) {}

	async execute({ db, providers }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person')
			.values({
				disable: true,
			})
			.where({
				id: this.personId,
			})
			.execute(db)
	}
}
