import Client from '../../../core/database/Client'
import { EventType } from '../EventType'
import { uuid } from '../../../utils/uuid'

class CreateEventCommand {
	constructor(
		private readonly type: EventType,
		private readonly data: any,
		private readonly previousId: string | null
	) {}

	public async execute(db: Client): Promise<string> {
		const id = uuid()
		await db
			.insertBuilder()
			.into('event')
			.values({
				id,
				type: this.type,
				data: this.data,
				previous_id: this.previousId,
			})
			.execute()
		return id
	}
}

export default CreateEventCommand
