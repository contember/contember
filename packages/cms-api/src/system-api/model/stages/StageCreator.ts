import KnexWrapper from '../../../core/knex/KnexWrapper'
import CreateOrUpdateStageCommand from '../commands/CreateOrUpdateStageCommand'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import EventApplier from '../events/EventApplier'
import DiffQuery from '../queries/DiffQuery'
import StageByIdQuery from '../queries/StageByIdQuery'
import { StageWithoutEvent } from '../dtos/Stage'

class StageCreator {
	constructor(
		private readonly db: KnexWrapper,
		private readonly eventApplier: EventApplier,
	) {
	}

	public async createStage(parent: StageWithoutEvent | null, stage: StageWithoutEvent): Promise<boolean> {
		const created = await new CreateOrUpdateStageCommand(stage).execute(this.db)
		if (!created) {
			return false
		}
		if (!parent) {
			return true
		}

		const queryHandler = this.db.createQueryHandler()

		const newStage = (await queryHandler.fetch(new StageByIdQuery(stage.id)))!
		const parentStage = (await queryHandler.fetch(new StageByIdQuery(parent.id)))!

		// both are new
		if (newStage.event_id === parentStage.event_id) {
			return true
		}

		const events = await queryHandler.fetch(new DiffQuery(newStage.event_id, parentStage.event_id))
		await this.eventApplier.applyEvents(newStage, events)

		await new UpdateStageEventCommand(newStage.id, parentStage.event_id).execute(this.db)

		return true
	}
}

export default StageCreator
