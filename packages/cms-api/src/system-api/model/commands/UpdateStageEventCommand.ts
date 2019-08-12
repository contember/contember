import { Client } from '@contember/database'

class UpdateStageEventCommand {
	constructor(private readonly stageId: string, private readonly eventId: string) {}

	public async execute(db: Client) {
		await db
			.updateBuilder()
			.table('stage')
			.where({ id: this.stageId })
			.values({
				event_id: this.eventId,
			})
			.execute()
	}
}

export default UpdateStageEventCommand
