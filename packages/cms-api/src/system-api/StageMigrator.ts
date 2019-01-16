import FileNameHelper from '../migrations/FileNameHelper'
import Project from '../config/Project'
import KnexWrapper from '../core/knex/KnexWrapper'
import StageByIdForUpdateQuery from './model/queries/StageByIdForUpdateQuery'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import UpdateStageEventCommand from './model/commands/UpdateStageEventCommand'
import CreateEventCommand from './model/commands/CreateEventCommand'
import { EventType } from './model/EventType'
import LatestMigrationByStageQuery from './model/queries/LatestMigrationByStageQuery'

class StageMigrator {
	constructor(private readonly migrationFilesManager: MigrationFilesManager) {}

	public async migrate(
		stage: Project.Stage,
		db: KnexWrapper,
		progressCb: (filename: string, content: string) => void
	): Promise<StageMigrator.Result> {
		return db.transaction(async knexWrapper => {
			const handler = knexWrapper.createQueryHandler()

			const targetVersion = stage.migration
			if (!targetVersion) {
				return { count: 0 }
			}

			const currentStageRow = (await handler.fetch(new StageByIdForUpdateQuery(stage.uuid)))!
			const currentMigration = await handler.fetch(new LatestMigrationByStageQuery(stage.uuid))
			const currentMigrationFile = currentMigration === null ? '' : currentMigration.data.file
			const currentVersion = FileNameHelper.extractVersion(currentMigrationFile)

			if (currentVersion > `${targetVersion}`) {
				throw new StageMigrator.MigrationError(
					`Cannot revert to migration ${targetVersion}. Current migration is ${currentMigrationFile}`
				)
			}

			const migrations = await this.migrationFilesManager.readFiles(
				'sql',
				version => version >= currentVersion && version <= targetVersion
			)

			if (!migrations.find(({ version }) => version === targetVersion)) {
				throw new StageMigrator.MigrationError(`Target migration ${targetVersion} does not exist`)
			}

			const migrationsToExecute = migrations.filter(({ version }) => version > currentVersion)

			await knexWrapper.raw('SET search_path TO ??', 'stage_' + stage.slug)

			if (migrationsToExecute.length === 0) {
				return { count: 0 }
			}

			let previousId = currentStageRow.event_id
			for (const { filename, content } of migrationsToExecute) {
				progressCb(filename, content)

				await knexWrapper.raw(content)
				previousId = await new CreateEventCommand(
					EventType.runMigration,
					{
						file: filename,
					},
					previousId
				).execute(knexWrapper)
			}

			await new UpdateStageEventCommand(stage.uuid, previousId).execute(knexWrapper)

			return { count: migrationsToExecute.length }
		})
	}
}

namespace StageMigrator {
	export type Result = { count: number }

	export class MigrationError extends Error {}
}

export default StageMigrator
