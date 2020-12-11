import { CreateOrUpdateStageCommand, UpdateStageEventCommand } from '../commands'
import { EventApplier } from '../events'
import { DiffQuery, StageBySlugQuery } from '../queries'
import { StageConfig } from '../../types'
import { emptySchema } from '@contember/schema-utils'
import { DatabaseContext } from '../database'
import { ImplementationException } from '../../utils'
import { Logger } from '@contember/engine-common'

class StageCreator {
	constructor(private readonly eventApplier: EventApplier) {}

	public async createStage(
		db: DatabaseContext,
		parent: StageConfig | null,
		stage: StageConfig,
		logger: Logger,
	): Promise<boolean> {
		const stageRow = await db.queryHandler.fetch(new StageBySlugQuery(stage.slug))
		if (stageRow && stageRow.name === stage.name) {
			return false
		}
		const created = await db.commandBus.execute(new CreateOrUpdateStageCommand(stage))
		if (!created) {
			return false
		}
		if (!parent) {
			return true
		}

		const queryHandler = db.client.createQueryHandler()

		const newStage = await queryHandler.fetch(new StageBySlugQuery(stage.slug))
		const parentStage = await queryHandler.fetch(new StageBySlugQuery(parent.slug))
		if (!newStage || !parentStage) {
			throw new ImplementationException()
		}

		// both are new
		if (newStage.event_id === parentStage.event_id) {
			return true
		}
		logger.write(`Creating stage ${stage.slug}`)
		const events = await queryHandler.fetch(new DiffQuery(newStage.event_id, parentStage.event_id))
		logger.write(`Got ${events.length} to apply...`)
		await this.eventApplier.applyEvents(db, newStage, events, emptySchema)
		logger.write(`Done`)

		await db.commandBus.execute(new UpdateStageEventCommand(newStage.slug, parentStage.event_id))

		return true
	}
}

export { StageCreator }
