import { ProjectConfig } from '../types'
import { ProjectMigrator, SchemaVersionBuilder } from './migrations'
import { StageCreator } from './stages'
import { DatabaseContext, DatabaseContextFactory } from './database'
import { SystemDbMigrationsRunnerFactory } from '../SystemContainer'
import {
	Client,
	Connection,
	createDatabaseIfNotExists,
	DatabaseConfig,
	retryTransaction,
} from '@contember/database'
import { Logger } from '@contember/engine-common'

export class ProjectInitializer {
	constructor(
		private readonly projectMigrator: ProjectMigrator,
		private readonly stageCreator: StageCreator,
		private readonly systemDbMigrationsRunnerFactory: SystemDbMigrationsRunnerFactory,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async initialize(
		databaseContextFactory: DatabaseContextFactory,
		project: ProjectConfig & { db?: DatabaseConfig },
		logger: Logger,
	) {
		const dbContext = databaseContextFactory.create()
		if (project.db) {
			// todo: use dbContext
			logger.group(`Executing system schema migration`)
			await createDatabaseIfNotExists(project.db, logger.write.bind(logger))
			const singleConnection = Connection.createSingle(project.db, {})
			await singleConnection.scope(async connection => {
				const systemSchema = dbContext.client.schema
				const dbContextMigrations = databaseContextFactory
					.withClient(new Client(connection, systemSchema, { module: 'system' }))
					.create()

				const schemaResolver = () => this.schemaVersionBuilder.buildSchema(dbContextMigrations)
				await this.systemDbMigrationsRunnerFactory(connection, systemSchema).migrate(
					logger.write.bind(logger),
					{
						schemaResolver,
						project,
					},
				)
			})
			await singleConnection.end()
			logger.groupEnd()
		}
		const result = await retryTransaction(() =>
			dbContext.transaction(async trx => {
				await this.initStages(trx, project, logger)
			}),
		)
		if (dbContext.client.connection instanceof Connection) {
			await dbContext.client.connection.clearPool()
		}
		return result
	}

	private async initStages(db: DatabaseContext<Connection.TransactionLike>, project: ProjectConfig, logger: Logger) {

		logger.group(`Creating stages`)

		for (const stage of project.stages) {
			const created = await this.stageCreator.createStage(db, stage)
			if (created) {
				logger.write(`Created stage ${stage.slug} `)
			} else {
				logger.breadcrumb(`Updated stage ${stage.slug}`)
			}
		}

		logger.groupEnd()
	}
}
