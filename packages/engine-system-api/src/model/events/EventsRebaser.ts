import { UpdateStageEventCommand } from '../commands'
import { DatabaseContext } from '../database'

export class EventsRebaser {
	constructor() {}

	public async rebaseStageEvents(
		db: DatabaseContext,
		stageSlug: string,
		headEvent: string,
		oldBase: string,
		newBase: string,
		droppedEvents: string[],
	): Promise<string> {
		// eslint-disable-next-line no-console
		console.log('Old head: ' + headEvent)
		// eslint-disable-next-line no-console
		console.log('Old base: ' + oldBase)
		// eslint-disable-next-line no-console
		console.log('New base: ' + newBase)

		const result: {
			rows: { old_id: string; new_id: string }[]
		} = await db.client.query('SELECT * FROM system.rebase_events_unsafe(?::UUID, ?::UUID, ?::UUID, ?::UUID[]) AS t', [
			headEvent,
			oldBase,
			newBase,
			droppedEvents,
		])

		const newHead = result.rows[0] ? result.rows[0].new_id : newBase

		// eslint-disable-next-line no-console
		console.log('New head: ' + newHead)

		await db.commandBus.execute(new UpdateStageEventCommand(stageSlug, newHead))

		return newHead
		// return result.rows.reduce((result, row) => ({ ...result, [row.old_id]: row.new_id }), {})
	}
}
