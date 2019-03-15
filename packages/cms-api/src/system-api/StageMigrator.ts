import FileNameHelper from '../migrations/FileNameHelper'
import Project from '../config/Project'
import KnexWrapper from '../core/knex/KnexWrapper'
import StageByIdQuery from './model/queries/StageByIdQuery'
import LatestMigrationByStageQuery from './model/queries/LatestMigrationByStageQuery'
import MigrationExecutor from './model/migrations/MigrationExecutor'
import Migration from './model/migrations/Migration'
import SchemaVersionBuilder from '../content-schema/SchemaVersionBuilder'
import { emptySchema } from '../content-schema/schemaUtils'


class StageMigrator {
	constructor(
		private readonly db: KnexWrapper,
		private readonly migrations: Promise<Migration[]>,
		private readonly migrationExecutor: MigrationExecutor,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {
	}

	public async migrate(
		stage: Project.Stage,
		progressCb: (version: string) => void
	): Promise<StageMigrator.Result> {
		return this.db.transaction(async trx => {
			const handler = trx.createQueryHandler()

			if (!stage.migration) {
				return { count: 0 }
			}

			const targetVersion = FileNameHelper.extractVersion(stage.migration)

			const currentStageRow = (await handler.fetch(new StageByIdQuery(stage.uuid, true)))!
			const currentMigration = await handler.fetch(new LatestMigrationByStageQuery(stage.uuid))
			const currentVersion = currentMigration === null ? null : currentMigration.data.version

			if (currentVersion !== null && currentVersion > `${targetVersion}`) {
				throw new StageMigrator.MigrationError(
					`Cannot revert to migration ${targetVersion}. Current version is ${currentVersion}`
				)
			}

			const migrations = (await this.migrations)
				.filter(({version}) => (currentVersion === null || version >= currentVersion) && version <= targetVersion)

			if (!migrations.find(({ version }) => version === targetVersion)) {
				throw new StageMigrator.MigrationError(`Target migration ${targetVersion} does not exist`)
			}

			const migrationsToExecute = migrations.filter(({ version }) => currentVersion === null || version > currentVersion)

			if (migrationsToExecute.length === 0) {
				return { count: 0 }
			}

			const schema = currentVersion === null ? emptySchema : (await this.schemaVersionBuilder.buildSchema(currentVersion))

			await this.migrationExecutor.execute(trx, currentStageRow, migrationsToExecute, schema, progressCb)

			return { count: migrationsToExecute.length }
		})
	}
}

namespace StageMigrator {
	export type Result = { count: number }

	export class MigrationError extends Error {}
}

export default StageMigrator
