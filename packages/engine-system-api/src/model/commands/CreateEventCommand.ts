import { InsertBuilder } from '@contember/database'
import { EventType } from '@contember/engine-common'
import { Command } from './Command'

class CreateEventCommand implements Command<string> {
	constructor(
		private readonly type: EventType,
		private readonly data: any,
		private readonly previousId: string | null,
	) {}

	public async execute({ db, providers }: Command.Args): Promise<string> {
		const id = providers.uuid()
		await InsertBuilder.create()
			.into('event')
			.values({
				id,
				type: this.type,
				data: this.data,
				previous_id: this.previousId,
			})
			.execute(db)
		return id
	}
}

export default CreateEventCommand
