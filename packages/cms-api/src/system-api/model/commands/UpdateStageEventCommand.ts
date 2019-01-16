import KnexWrapper from '../../../core/knex/KnexWrapper'

class UpdateStageEventCommand {
	constructor(private readonly stageId: string, private readonly eventId: string) {}

	public async execute(db: KnexWrapper) {
		await db
			.updateBuilder()
			.table('event')
			.where({ id: this.stageId })
			.values({
				event_id: this.eventId,
			})
			.execute()
	}
}

export default UpdateStageEventCommand
