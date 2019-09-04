import { Client } from '@contember/database'
import { UuidProvider } from '../../utils/uuid'
import { InsertBuilder } from '@contember/database'
import { EventType } from '../EventType'

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
			.onConflict(InsertBuilder.ConflictActionType.doNothing, { constraint: 'unique_init' })
			.execute()
	}
}

export default CreateInitEventCommand
