import { Client } from '@contember/database'

class UpdateStageEventCommand {
	constructor(private readonly stageSlug: string, private readonly eventId: string) {}

	public async execute(db: Client) {
		await db
			.updateBuilder()
			.table('stage')
			.where({ slug: this.stageSlug })
			.values({
				event_id: this.eventId,
			})
			.execute()
	}
}

export default UpdateStageEventCommand
