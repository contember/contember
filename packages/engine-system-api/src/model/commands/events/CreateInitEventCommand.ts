import { ConflictActionType, InsertBuilder } from '@contember/database'
import { EventType } from '@contember/engine-common'
import { Command } from '../Command'

export class CreateInitEventCommand implements Command<string | null> {
	public async execute({ db, providers }: Command.Args): Promise<string | null> {
		const id = providers.uuid()
		const resultCount = await InsertBuilder.create()
			.into('event')
			.values({
				id: id,
				type: EventType.init,
				data: '{}',
				previous_id: null,
			})
			.onConflict(ConflictActionType.doNothing, { constraint: 'unique_init' })
			.execute(db)
		return resultCount > 0 ? id : null
	}
}
