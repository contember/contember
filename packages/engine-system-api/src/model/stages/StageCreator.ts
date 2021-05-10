import { CreateOrUpdateStageCommand } from '../commands'
import { StageBySlugQuery } from '../queries'
import { StageConfig } from '../../types'
import { DatabaseContext } from '../database'
import { Logger } from '@contember/engine-common'
import { StagingDisabledError } from '../../StagingDisabledError'

class StageCreator {
	constructor() {}

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
		throw new StagingDisabledError()
	}
}

export { StageCreator }
