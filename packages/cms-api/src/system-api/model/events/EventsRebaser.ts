import Client from '../../../core/database/Client'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import { debug } from '../../../core/console/messages'

class EventsRebaser {
	constructor(private readonly db: Client) {}

	public async rebaseStageEvents(
		stageId: string,
		headEvent: string,
		oldBase: string,
		newBase: string,
		droppedEvents: string[]
	): Promise<string> {
		const result: { rows: { old_id: string; new_id: string }[] } = await this.db.query(
			'SELECT * FROM system.rebase_events_unsafe(?::UUID, ?::UUID, ?::UUID, ?::UUID[]) AS t',
			[
				headEvent,
				oldBase,
				newBase,
				droppedEvents,
			]
		)

		const newHead = result.rows[0] ? result.rows[0].new_id : newBase

		console.log(debug('Old head: ' + headEvent))
		console.log(debug('Old base: ' + oldBase))
		console.log(debug('New head: ' + newHead))
		console.log(debug('New base: ' + newBase))

		await new UpdateStageEventCommand(stageId, newHead).execute(this.db)

		return newHead
		// return result.rows.reduce((result, row) => ({ ...result, [row.old_id]: row.new_id }), {})
	}
}

export default EventsRebaser
