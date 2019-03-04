import { Stage } from '../dtos/Stage'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'

class EventsRebaser {
	constructor(private readonly db: KnexWrapper) {}

	public async rebaseStage(headStage: Stage, oldBase: Stage, newBase: Stage, droppedEvents: string[]) {
		const result = await this.db.raw(
			'SELECT t.id FROM system.rebase_events_unsafe(?::uuid, ?::uuid, ?::uuid, ?::uuid[]) AS t(id)',
			headStage.event_id,
			oldBase.event_id,
			newBase.event_id,
			droppedEvents
		)

		const newHead = result.rows[0].id || newBase.event_id

		console.log('Old head: ' + headStage.event_id)
		console.log('Old base: ' + oldBase.event_id)
		console.log('New head: ' + newHead)
		console.log('New base: ' + newBase.event_id)

		await new UpdateStageEventCommand(headStage.id, newHead).execute(this.db)
	}
}

export default EventsRebaser
