import FileNameHelper from '../migrations/FileNameHelper'
import Project from '../config/Project'
import KnexWrapper from '../core/knex/KnexWrapper'
import StageByIdQuery from './model/queries/StageByIdQuery'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import LatestMigrationByStageQuery from './model/queries/LatestMigrationByStageQuery'
import MigrationExecutor from './model/migrations/MigrationExecutor'

class StageMigrator {
	constructor(private readonly migrationFilesManager: MigrationFilesManager) {}

	public async migrate(
		stage: Project.Stage,
		db: KnexWrapper,
		progressCb: (filename: string, content: string) => void
	): Promise<StageMigrator.Result> {
		return db.transaction(async knexWrapper => {
			const handler = knexWrapper.createQueryHandler()

			if (!stage.migration) {
				return { count: 0 }
			}

			const targetVersion = FileNameHelper.extractVersion(stage.migration)

			const currentStageRow = (await handler.fetch(new StageByIdQuery(stage.uuid, true)))!
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

			if (migrationsToExecute.length === 0) {
				return { count: 0 }
			}

			const executor = new MigrationExecutor(knexWrapper)

			await executor.execute(currentStageRow, migrationsToExecute, progressCb)

			return { count: migrationsToExecute.length }
		})
	}
}

namespace StageMigrator {
	export type Result = { count: number }

	export class MigrationError extends Error {}
}

export default StageMigrator
