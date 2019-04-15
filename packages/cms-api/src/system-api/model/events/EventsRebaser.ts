import KnexWrapper from '../../../core/knex/KnexWrapper'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'

class EventsRebaser {
	constructor(private readonly db: KnexWrapper) {}

	public async rebaseStageEvents(
		stageId: string,
		headEvent: string,
		oldBase: string,
		newBase: string,
		droppedEvents: string[]
	): Promise<string> {
		console.log(oldBase)
		console.log(headEvent)
		const result: { rows: { old_id: string; new_id: string }[] } = await this.db.raw(
			'SELECT * FROM system.rebase_events_unsafe(?::UUID, ?::UUID, ?::UUID, ?::UUID[]) AS t',
			headEvent,
			oldBase,
			newBase,
			droppedEvents
		)

		const newHead = result.rows[0] ? result.rows[0].new_id : newBase

		console.log('Old head: ' + headEvent)
		console.log('Old base: ' + oldBase)
		console.log('New head: ' + newHead)
		console.log('New base: ' + newBase)

		await new UpdateStageEventCommand(stageId, newHead).execute(this.db)

		return newHead
		// return result.rows.reduce((result, row) => ({ ...result, [row.old_id]: row.new_id }), {})
	}
}

export default EventsRebaser
