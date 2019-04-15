import Project from '../config/Project'
import KnexWrapper from '../core/knex/KnexWrapper'
import StageByIdQuery from './model/queries/StageByIdQuery'
import LatestMigrationByStageQuery from './model/queries/LatestMigrationByStageQuery'
import MigrationExecutor from './model/migrations/MigrationExecutor'
import MigrationsResolver from '../content-schema/MigrationsResolver'

class StageMigrator {
	constructor(
		private readonly db: KnexWrapper,
		private readonly migrationsResolver: MigrationsResolver,
		private readonly migrationExecutor: MigrationExecutor
	) {}

	public async migrate(
		stage: Project.Stage,
		progressCb: (version: string) => void,
		targetVersion?: string
	): Promise<StageMigrator.Result> {
		return this.db.transaction(async trx => {
			const handler = trx.createQueryHandler()

			const currentStageRow = (await handler.fetch(new StageByIdQuery(stage.uuid, true)))!
			const currentMigration = await handler.fetch(new LatestMigrationByStageQuery(stage.uuid))
			const currentVersion = currentMigration === null ? null : currentMigration.data.version

			if (currentVersion !== null && currentVersion > `${targetVersion}`) {
				throw new StageMigrator.MigrationError(
					`Cannot revert to migration ${targetVersion}. Current version is ${currentVersion}`
				)
			}

			const migrations = (await this.migrationsResolver.getMigrations()).filter(
				({ version }) =>
					(currentVersion === null || version >= currentVersion) && (!targetVersion || version <= targetVersion)
			)

			if (targetVersion && !migrations.find(({ version }) => version === targetVersion)) {
				throw new StageMigrator.MigrationError(`Target migration ${targetVersion} does not exist`)
			}

			const migrationsToExecute = migrations.filter(
				({ version }) => currentVersion === null || version > currentVersion
			)

			await this.migrationExecutor.execute(trx, currentStageRow, migrationsToExecute, progressCb)

			return { count: migrationsToExecute.length }
		})
	}
}

namespace StageMigrator {
	export type Result = { count: number }

	export class MigrationError extends Error {}
}

export default StageMigrator
