import { Client } from '@contember/database'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'

class EventsRebaser {
	constructor(private readonly db: Client) {}

	public async rebaseStageEvents(
		stageSlug: string,
		headEvent: string,
		oldBase: string,
		newBase: string,
		droppedEvents: string[],
	): Promise<string> {
		console.log('Old head: ' + headEvent)
		console.log('Old base: ' + oldBase)
		console.log('New base: ' + newBase)

		const result: { rows: { old_id: string; new_id: string }[] } = await this.db.query(
			'SELECT * FROM system.rebase_events_unsafe(?::UUID, ?::UUID, ?::UUID, ?::UUID[]) AS t',
			[headEvent, oldBase, newBase, droppedEvents],
		)

		const newHead = result.rows[0] ? result.rows[0].new_id : newBase

		console.log('New head: ' + newHead)

		await new UpdateStageEventCommand(stageSlug, newHead).execute(this.db)

		return newHead
		// return result.rows.reduce((result, row) => ({ ...result, [row.old_id]: row.new_id }), {})
	}
}

export default EventsRebaser
