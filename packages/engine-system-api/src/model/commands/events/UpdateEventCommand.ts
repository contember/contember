import { UpdateBuilder } from '@contember/database'
import { Command } from '../Command'

export class UpdateEventCommand implements Command<void> {
	constructor(private readonly id: string, private readonly data: any) {}

	public async execute({ db, providers }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('event')
			.values({
				data: this.data,
			})
			.where({ id: this.id })
			.execute(db)
	}
}
