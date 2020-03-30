import { Client } from '@contember/database'
import CreateOrUpdateStageCommand from '../commands/CreateOrUpdateStageCommand'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import EventApplier from '../events/EventApplier'
import { DiffQuery, StageBySlugQuery } from '../queries'
import { StageConfig } from '../../types'
import { UuidProvider } from '../../utils/uuid'
import { Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'

class StageCreator {
	constructor(
		private readonly db: Client,
		private readonly eventApplier: EventApplier,
		private readonly providers: UuidProvider,
	) {}

	public async createStage(parent: StageConfig | null, stage: StageConfig): Promise<boolean> {
		const created = await new CreateOrUpdateStageCommand(stage, this.providers).execute(this.db)
		if (!created) {
			return false
		}
		if (!parent) {
			return true
		}

		const queryHandler = this.db.createQueryHandler()

		const newStage = (await queryHandler.fetch(new StageBySlugQuery(stage.slug)))!
		const parentStage = (await queryHandler.fetch(new StageBySlugQuery(parent.slug)))!

		// both are new
		if (newStage.event_id === parentStage.event_id) {
			return true
		}

		const events = await queryHandler.fetch(new DiffQuery(newStage.event_id, parentStage.event_id))
		await this.eventApplier.applyEvents(newStage, events, emptySchema)

		await new UpdateStageEventCommand(newStage.slug, parentStage.event_id).execute(this.db)

		return true
	}
}

export default StageCreator
