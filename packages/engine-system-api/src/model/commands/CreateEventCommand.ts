import { Client } from '@contember/database'
import { EventType } from '../EventType'
import { UuidProvider } from '../../utils/uuid'

class CreateEventCommand {
	constructor(
		private readonly type: EventType,
		private readonly data: any,
		private readonly previousId: string | null,
		private readonly providers: UuidProvider,
	) {}

	public async execute(db: Client): Promise<string> {
		const id = this.providers.uuid()
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
