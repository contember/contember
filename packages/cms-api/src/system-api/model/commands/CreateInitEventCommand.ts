import KnexWrapper from '../../../core/knex/KnexWrapper'
import { uuid } from '../../../utils/uuid'
import InsertBuilder from '../../../core/knex/InsertBuilder'
import { EventType } from '../EventType'

class CreateInitEventCommand {
	public async execute(db: KnexWrapper): Promise<number> {
		return await db
			.insertBuilder()
			.into('event')
			.values({
				id: uuid(),
				type: EventType.init,
				data: '{}',
				previous_id: null,
			})
			.onConflict(InsertBuilder.ConflictActionType.doNothing, { constraint: 'unique_init' })
			.execute()
	}
}

export default CreateInitEventCommand
