import { Command } from '../Command'
import { UpdateBuilder } from '@contember/database'

export class TogglePersonPasswordlessCommand implements Command<void> {
	constructor(private readonly personId: string, private readonly value: boolean | null) { }

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('person')
			.values({
				passwordless_enabled: this.value,
			})
			.where({
				id: this.personId,
			})
			.execute(db)
	}
}
