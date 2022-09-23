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
	EventManager,
	retryTransaction,
} from '@contember/database'
import { Logger, LogLevels } from '@contember/engine-common'

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
		const initLogger = logger.child({}, {
			fingersCrossedLogLevel: LogLevels.info,
		})
		if (project.db) {
			// todo: use dbContext
			const migrationsLogger = initLogger.child()
			migrationsLogger.debug('Executing system schema migrations')
			await createDatabaseIfNotExists(project.db, message => typeof message === 'string' ? migrationsLogger.warn(message) : migrationsLogger.error(message))
			const singleConnection = Connection.createSingle(project.db, err => migrationsLogger.error(err))
			singleConnection.eventManager.on(EventManager.Event.clientError, err => logger.error(err, 'Database client error'))

			await singleConnection.scope(async connection => {
				const systemSchema = dbContext.client.schema

				const schemaResolver = (connection: Connection.ConnectionLike) => {
					const dbContextMigrations = databaseContextFactory
						.withClient(new Client(connection, systemSchema, { module: 'system' }))
						.create()
					return this.schemaVersionBuilder.buildSchema(dbContextMigrations)
				}
				await this.systemDbMigrationsRunnerFactory(connection, systemSchema).migrate(
					message => migrationsLogger.warn(message),
					{
						schemaResolver,
						project,
					},
				)
			})
			await singleConnection.end()
		}
		await retryTransaction(() =>
			dbContext.transaction(async trx => {
				await this.initStages(trx, project, logger.child())
			}),
		message => initLogger.warn(message),
		)
		if (dbContext.client.connection instanceof Connection) {
			await dbContext.client.connection.clearPool()
		}
	}

	private async initStages(db: DatabaseContext<Connection.TransactionLike>, project: ProjectConfig, logger: Logger) {

		logger.debug(`Creating stages`)

		for (const stage of project.stages) {
			const created = await this.stageCreator.createStage(db, stage)
			if (created) {
				logger.warn(`Created stage ${stage.slug}`, { stage: stage.slug })
			} else {
				logger.debug(`Updated stage ${stage.slug}`, { stage: stage.slug })
			}
		}
	}
}
