import { CreateInitEventCommand, SaveMigrationCommand } from './commands'
import { unnamedIdentity } from './helpers'
import { ProjectConfig, StageConfig } from '../types'
import { ProjectMigrationInfoResolver, ProjectMigrator, SchemaVersionBuilder } from './migrations'
import { createStageTree, StageCreator } from './stages'
import { MigrationEventsQuery } from './queries'
import { DatabaseContext, DatabaseContextFactory } from './database'
import { SystemDbMigrationsRunnerFactory } from '../SystemContainer'
import { DatabaseCredentials, EventManagerImpl, SingleConnection } from '@contember/database'
import { MigrationArgs } from '../migrations'
import { createPgClient } from '@contember/database-migrations'

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
	) {
		const dbContext = databaseContextFactory.create(unnamedIdentity)
		if (project.db) {
			// todo: use dbContext
			console.group(`Executing system schema migration`)
			const pgClient = createPgClient(project.db)
			await pgClient.connect()
			const singleConnection = new SingleConnection(pgClient, {}, new EventManagerImpl(), true)
			const dbContextMigrations = databaseContextFactory
				.withClient(singleConnection.createClient('system'))
				.create(unnamedIdentity)

			const schemaResolver = () => this.schemaVersionBuilder.buildSchema(dbContextMigrations)
			await this.systemDbMigrationsRunnerFactory(project.db, pgClient).migrate<MigrationArgs>(true, {
				schemaResolver,
				project,
			})
			await pgClient.end()
			console.groupEnd()
		}
		return dbContext.transaction(async trx => {
			await this.createInitEvent(trx)
			await this.initStages(trx, project)
		})
	}

	private async createInitEvent(db: DatabaseContext) {
		const rowCount = await db.commandBus.execute(new CreateInitEventCommand())
		if (rowCount) {
			console.log(`Created init event`)
		}
	}

	private async initStages(db: DatabaseContext, project: ProjectConfig) {
		const stageTree = createStageTree(project)
		const root = stageTree.getRoot()
		await this.upgradeSchemaMigrations(db, project, root.slug)

		const createStage = async (parent: StageConfig | null, stage: StageConfig) => {
			const created = await this.stageCreator.createStage(db, parent, stage)
			if (created) {
				console.log(`Created stage ${stage.slug} `)
			} else {
				console.log(`Updated stage ${stage.slug}`)
			}
		}

		const createRecursive = async (parent: StageConfig | null, stage: StageConfig) => {
			await createStage(parent, stage)
			for (const childStage of stageTree.getChildren(stage)) {
				await createRecursive(stage, childStage)
			}
		}

		console.group(`Creating stages`)
		await createRecursive(null, root)
		console.groupEnd()

		console.group(`Executing project migrations`)
		await this.runMigrations(db, project)
		console.groupEnd()
	}

	private async runMigrations(db: DatabaseContext, project: ProjectConfig) {
		if (!this.projectMigrationInfoResolver) {
			return
		}
		const {
			migrationsToExecute,
			migrationsDirectory,
			allMigrations,
			badMigrations,
		} = await this.projectMigrationInfoResolver.getMigrationsInfo(db, project)

		console.log(`Reading migrations from directory "${migrationsDirectory}"`)
		for (const bad of badMigrations) {
			console.warn(bad.error)
		}

		if (allMigrations.length === 0) {
			console.warn(`No migrations for project found.`)
			return
		}

		if (migrationsToExecute.length === 0) {
			console.log(`No migrations to execute for project`)
			return
		}

		await this.projectMigrator.migrate(db, project, migrationsToExecute, version =>
			console.log(`Executing migration ${version}`),
		)
	}

	private async upgradeSchemaMigrations(db: DatabaseContext, project: ProjectConfig, stage: string) {
		if (!this.projectMigrationInfoResolver) {
			return
		}
		const migrationEvents = await db.queryHandler.fetch(new MigrationEventsQuery(stage))
		const { allMigrations, executedMigrations } = await this.projectMigrationInfoResolver.getMigrationsInfo(db, project)
		if (executedMigrations.length > 0 || migrationEvents.length === 0) {
			return
		}
		console.group('Upgrading schema migrations')
		for (const event of migrationEvents) {
			const version = event.data.version
			const migration = allMigrations.find(it => it.version === version)
			if (!migration) {
				console.warn(`Previously executed migration ${version} not found`)
				continue
			}
			await db.commandBus.execute(new SaveMigrationCommand(migration, event.created_at))
		}
		console.groupEnd()
	}
}
