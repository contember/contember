import MigrationFilesManager from '../../../migrations/MigrationFilesManager'
import { Stage } from '../dtos/Stage'
import CreateEventCommand from '../commands/CreateEventCommand'
import { EventType } from '../EventType'
import UpdateStageEventCommand from '../commands/UpdateStageEventCommand'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import { formatSchemaName } from '../helpers/stageHelpers'

class MigrationExecutor {
	constructor(private readonly db: KnexWrapper) {}

	public async execute(
		stage: Stage,
		files: MigrationFilesManager.MigrationFile[],
		progressCb: (filename: string, content: string) => void
	): Promise<void> {
		await this.db.raw('SET search_path TO ??', formatSchemaName(stage))

		let previousId = stage.event_id
		for (const { filename, content } of files) {
			progressCb(filename, content)

			await this.db.raw(content)
			previousId = await new CreateEventCommand(
				EventType.runMigration,
				{
					file: filename,
				},
				previousId
			).execute(this.db)
		}

		await new UpdateStageEventCommand(stage.id, previousId).execute(this.db)
	}
}

export default MigrationExecutor
