import { Client, ConflictActionType } from '@contember/database'
import { UuidProvider } from '../../utils/uuid'
import { EventType } from '@contember/engine-common'

class CreateInitEventCommand {
	constructor(private readonly providers: UuidProvider) {}

	public async execute(db: Client): Promise<number> {
		return await db
			.insertBuilder()
			.into('event')
			.values({
				id: this.providers.uuid(),
				type: EventType.init,
				data: '{}',
				previous_id: null,
			})
			.onConflict(ConflictActionType.doNothing, { constraint: 'unique_init' })
			.execute()
	}
}

export default CreateInitEventCommand
