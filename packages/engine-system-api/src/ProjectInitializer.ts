import CreateInitEventCommand from './model/commands/CreateInitEventCommand'
import { unnamedIdentity } from './SystemVariablesSetupHelper'
import { ProjectConfig, StageConfig } from './types'
import ProjectMigrator from './model/migrations/ProjectMigrator'
import ProjectMigrationInfoResolver from './model/migrations/ProjectMigrationInfoResolver'
import StageCreator from './model/stages/StageCreator'
import { MigrationEventsQuery } from './model/queries'
import { SaveMigrationCommand } from './model/commands/SaveMigrationCommand'
import { DatabaseContext, DatabaseContextFactory } from './model'
import { createStageTree } from './model/stages/StageTree'

export class ProjectInitializer {
	constructor(
		private readonly projectMigrator: ProjectMigrator,
		private readonly projectMigrationInfoResolver: ProjectMigrationInfoResolver | undefined,
		private readonly stageCreator: StageCreator,
	) {}

	public async initialize(databaseContextFactory: DatabaseContextFactory, project: ProjectConfig) {
		return databaseContextFactory.create(unnamedIdentity).transaction(async trx => {
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
