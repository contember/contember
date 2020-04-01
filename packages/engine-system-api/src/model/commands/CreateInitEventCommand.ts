import { Client, ConflictActionType, InsertBuilder } from '@contember/database'
import { UuidProvider } from '../../utils/uuid'
import { EventType } from '@contember/engine-common'
import { Command } from './Command'

class CreateInitEventCommand implements Command<number> {
	public async execute({ db, providers }: Command.Args): Promise<number> {
		return await InsertBuilder.create()
			.into('event')
			.values({
				id: providers.uuid(),
				type: EventType.init,
				data: '{}',
				previous_id: null,
			})
			.onConflict(ConflictActionType.doNothing, { constraint: 'unique_init' })
			.execute(db)
	}
}

export default CreateInitEventCommand
