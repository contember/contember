import { CreateOrUpdateStageCommand } from '../commands'
import { StageBySlugQuery } from '../queries'
import { StageConfig } from '../../types'
import { DatabaseContext } from '../database'

class StageCreator {
	constructor() {}

	public async createStage(
		db: DatabaseContext,
		stage: StageConfig,
	): Promise<boolean> {
		const stageRow = await db.queryHandler.fetch(new StageBySlugQuery(stage.slug))
		if (stageRow && stageRow.name === stage.name) {
			return false
		}
		return await db.commandBus.execute(new CreateOrUpdateStageCommand(stage))
	}
}

export { StageCreator }
