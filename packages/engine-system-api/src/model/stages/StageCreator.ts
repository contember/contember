import { CreateOrUpdateStageCommand, UpdateStageEventCommand } from '../commands'
import { EventApplier } from '../events'
import { DiffQuery, StageBySlugQuery } from '../queries'
import { StageConfig } from '../../types'
import { emptySchema } from '@contember/schema-utils'
import { DatabaseContext } from '../database'

class StageCreator {
	constructor(private readonly eventApplier: EventApplier) {}

	public async createStage(db: DatabaseContext, parent: StageConfig | null, stage: StageConfig): Promise<boolean> {
		const created = await db.commandBus.execute(new CreateOrUpdateStageCommand(stage))
		if (!created) {
			return false
		}
		if (!parent) {
			return true
		}

		const queryHandler = db.client.createQueryHandler()

		const newStage = (await queryHandler.fetch(new StageBySlugQuery(stage.slug)))!
		const parentStage = (await queryHandler.fetch(new StageBySlugQuery(parent.slug)))!

		// both are new
		if (newStage.event_id === parentStage.event_id) {
			return true
		}

		const events = await queryHandler.fetch(new DiffQuery(newStage.event_id, parentStage.event_id))
		await this.eventApplier.applyEvents(db, newStage, events, emptySchema)

		await db.commandBus.execute(new UpdateStageEventCommand(newStage.slug, parentStage.event_id))

		return true
	}
}

export { StageCreator }
