import CreateInitEventCommand from './model/commands/CreateInitEventCommand'
import { unnamedIdentity } from './SystemVariablesSetupHelper'
import { StageConfig } from './types'
import ProjectMigrator from './model/migrations/ProjectMigrator'
import ProjectMigrationInfoResolver from './model/migrations/ProjectMigrationInfoResolver'
import StageCreator from './model/stages/StageCreator'
import StageTree from './model/stages/StageTree'
import { MigrationEventsQuery } from './model/queries'
import { SaveMigrationCommand } from './model/commands/SaveMigrationCommand'
import { DatabaseContext, DatabaseContextFactory } from './model'

export class ProjectInitializer {
	constructor(
		private readonly databaseContextFactory: DatabaseContextFactory,
		private readonly stageTree: StageTree,
		private readonly projectMigrator: ProjectMigrator,
		private readonly projectMigrationInfoResolver: ProjectMigrationInfoResolver,
		private readonly stageCreator: StageCreator,
	) {}

	public async initialize() {
		return this.databaseContextFactory.create(unnamedIdentity).transaction(async trx => {
			await this.createInitEvent(trx)
			await this.initStages(trx)
		})
	}

	private async createInitEvent(db: DatabaseContext) {
		const rowCount = await db.commandBus.execute(new CreateInitEventCommand())
		if (rowCount) {
			console.log(`Created init event`)
		}
	}

	private async initStages(db: DatabaseContext) {
		const root = this.stageTree.getRoot()
		await this.upgradeSchemaMigrations(db, root.slug)

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
			for (const childStage of this.stageTree.getChildren(stage)) {
				await createRecursive(stage, childStage)
			}
		}

		console.group(`Creating stages`)
		await createRecursive(null, root)
		console.groupEnd()

		console.group(`Executing project migrations`)
		await this.runMigrations(db)
		console.groupEnd()
	}

	private async runMigrations(db: DatabaseContext) {
		const {
			migrationsToExecute,
			migrationsDirectory,
			allMigrations,
			badMigrations,
		} = await this.projectMigrationInfoResolver.getMigrationsInfo(db)

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

		await this.projectMigrator.migrate(db, migrationsToExecute, version =>
			console.log(`Executing migration ${version}`),
		)
	}

	private async upgradeSchemaMigrations(db: DatabaseContext, stage: string) {
		const migrationEvents = await db.queryHandler.fetch(new MigrationEventsQuery(stage))
		const { allMigrations, executedMigrations } = await this.projectMigrationInfoResolver.getMigrationsInfo(db)
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
