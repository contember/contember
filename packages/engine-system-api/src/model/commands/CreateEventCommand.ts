import { Client, InsertBuilder } from '@contember/database'
import { EventType } from '@contember/engine-common'
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
