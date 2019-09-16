import { Client, UpdateBuilder } from '@contember/database'

class UpdateStageEventCommand {
	constructor(private readonly stageSlug: string, private readonly eventId: string) {}

	public async execute(db: Client) {
		await UpdateBuilder.create()
			.table('stage')
			.where({ slug: this.stageSlug })
			.values({
				event_id: this.eventId,
			})
			.execute(db)
	}
}

export default UpdateStageEventCommand
