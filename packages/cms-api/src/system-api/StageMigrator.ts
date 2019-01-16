import QueryHandler from '../core/query/QueryHandler'
import KnexQueryable from '../core/knex/KnexQueryable'
import FileNameHelper from '../migrations/FileNameHelper'
import Project from '../config/Project'
import KnexWrapper from '../core/knex/KnexWrapper'
import KnexConnection from '../core/knex/KnexConnection'
import StageByIdForUpdateQuery from './model/queries/StageByIdForUpdateQuery'
import LatestMigrationByCurrentEventQuery from './model/queries/LatestMigrationByCurrentEventQuery'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import UpdateStageEventCommand from './model/commands/UpdateStageEventCommand'
import CreateEventCommand from './model/commands/CreateEventCommand'
import { EventType } from './model/EventType'

class StageMigrator {
	constructor(private readonly migrationFilesManager: MigrationFilesManager) {}

	public async migrate(
		stage: Project.Stage,
		db: KnexWrapper,
		progressCb: (filename: string, content: string) => void
	): Promise<StageMigrator.Result> {
		return db.transaction(async knexWrapper => {
			const handler = new QueryHandler(
				new KnexQueryable(new KnexConnection(db.knex, db.schema), {
					get(): QueryHandler<KnexQueryable> {
						return handler
					},
				})
			)

			const currentStageRow = (await handler.fetch(new StageByIdForUpdateQuery(stage.uuid)))!
			const currentMigration = await handler.fetch(new LatestMigrationByCurrentEventQuery(currentStageRow.event_id))
			const currentMigrationFile = currentMigration === null ? '' : currentMigration.data.file
			const currentVersion = currentMigrationFile.substring(0, FileNameHelper.prefixLength)
			if (currentVersion > `${stage.migration}`) {
				throw new StageMigrator.MigrationError(
					`Cannot revert to migration ${stage.migration}. Current migration is ${currentMigrationFile}`
				)
			}

			const migrations = await this.migrationFilesManager.readFiles(
				'sql',
				version => version >= currentVersion && version <= stage.migration
			)

			if (!migrations.find(({ version }) => version === stage.migration)) {
				throw new StageMigrator.MigrationError(`Target migration ${stage.migration} does not exist`)
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
