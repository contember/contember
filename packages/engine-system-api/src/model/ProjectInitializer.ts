import { CreateInitEventCommand } from './commands'
import { unnamedIdentity } from './helpers'
import { ProjectConfig, StageConfig } from '../types'
import { ProjectMigrationInfoResolver, ProjectMigrator, SchemaVersionBuilder } from './migrations'
import { createStageTree, StageCreator } from './stages'
import { DatabaseContext, DatabaseContextFactory } from './database'
import { SystemDbMigrationsRunnerFactory } from '../SystemContainer'
import {
	Connection,
	DatabaseCredentials,
	EventManagerImpl,
	retryTransaction,
	SingleConnection,
} from '@contember/database'
import { MigrationArgs } from '../migrations'
import { createDatabaseIfNotExists, createPgClient } from '@contember/database-migrations'
import { Logger } from '@contember/engine-common'

export class ProjectInitializer {
	constructor(
		private readonly projectMigrator: ProjectMigrator,
		private readonly projectMigrationInfoResolver: ProjectMigrationInfoResolver | undefined,
		private readonly stageCreator: StageCreator,
		private readonly systemDbMigrationsRunnerFactory: SystemDbMigrationsRunnerFactory,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async initialize(
		databaseContextFactory: DatabaseContextFactory,
		project: ProjectConfig & { db?: DatabaseCredentials },
		logger: Logger,
	) {
		const dbContext = databaseContextFactory.create(unnamedIdentity)
		if (project.db) {
			// todo: use dbContext
			logger.group(`Executing system schema migration`)
			await createDatabaseIfNotExists(project.db, logger.write.bind(logger))
			const pgClient = await createPgClient(project.db)
			await pgClient.connect()
			const singleConnection = new SingleConnection(pgClient, {}, new EventManagerImpl(), true)
			const dbContextMigrations = databaseContextFactory
				.withClient(singleConnection.createClient('system', { module: 'system' }))
				.create(unnamedIdentity)

			const schemaResolver = () => this.schemaVersionBuilder.buildSchema(dbContextMigrations)
			await this.systemDbMigrationsRunnerFactory(project.db, pgClient).migrate<MigrationArgs>(
				logger.write.bind(logger),
				{
					schemaResolver,
					project,
					queryHandler: dbContextMigrations.queryHandler,
					migrationsResolverFactory: this.projectMigrationInfoResolver?.migrationsResolverFactory,
				},
			)
			await pgClient.end()
			logger.groupEnd()
		}
		return await retryTransaction(() =>
			dbContext.transaction(async trx => {
				await this.createInitEvent(trx, logger)
				await this.initStages(trx, project, logger)
			}),
		)
	}

	private async createInitEvent(db: DatabaseContext<Connection.TransactionLike>, logger: Logger) {
		const rowId = await db.commandBus.execute(new CreateInitEventCommand())
		if (rowId) {
			logger.write(`Created init event`)
		}
	}

	private async initStages(db: DatabaseContext<Connection.TransactionLike>, project: ProjectConfig, logger: Logger) {
		const stageTree = createStageTree(project)
		const root = stageTree.getRoot()

		const createStage = async (parent: StageConfig | null, stage: StageConfig) => {
			const created = await this.stageCreator.createStage(db, parent, stage)
			if (created) {
				logger.write(`Created stage ${stage.slug} `)
			} else {
				logger.breadcrumb(`Updated stage ${stage.slug}`)
			}
		}

		const createRecursive = async (parent: StageConfig | null, stage: StageConfig) => {
			await createStage(parent, stage)
			for (const childStage of stageTree.getChildren(stage)) {
				await createRecursive(stage, childStage)
			}
		}

		logger.group(`Creating stages`)
		await createRecursive(null, root)
		logger.groupEnd()

		logger.group(`Executing project migrations`)
		await this.runMigrations(db, project, logger)
		logger.groupEnd()
	}

	private async runMigrations(db: DatabaseContext, project: ProjectConfig, logger: Logger) {
		if (!this.projectMigrationInfoResolver) {
			return
		}
		const {
			migrationsToExecute,
			migrationsDirectory,
			allMigrations,
			badMigrations,
		} = await this.projectMigrationInfoResolver.getMigrationsInfo(db, project)

		try {
			logger.group(`Reading migrations from directory "${migrationsDirectory}"`)
			for (const bad of badMigrations) {
				logger.write(bad.error)
			}

			if (allMigrations.length === 0) {
				logger.write(`No migrations for project found.`)
				return
			}

			if (migrationsToExecute.length === 0) {
				logger.breadcrumb(`No migrations to execute for project`)
				return
			}

			await this.projectMigrator.migrate(db, project, migrationsToExecute, logger.write.bind(logger))
		} finally {
			logger.groupEnd()
		}
	}
}
