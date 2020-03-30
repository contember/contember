import CreateInitEventCommand from './model/commands/CreateInitEventCommand'
import { setupSystemVariables, unnamedIdentity } from './SystemVariablesSetupHelper'
import { StageConfig } from './types'
import { Client } from '@contember/database'
import ProjectMigrator from './model/migrations/ProjectMigrator'
import RebaseExecutor from './model/events/RebaseExecutor'
import ProjectMigrationInfoResolver from './model/migrations/ProjectMigrationInfoResolver'
import StageCreator from './model/stages/StageCreator'
import StageTree from './model/stages/StageTree'
import { UuidProvider } from './utils/uuid'
import { SchemaVersionBuilder } from './SchemaVersionBuilder'
import { Schema } from '@contember/schema'
import { MigrationEventsQuery } from './model/queries'
import { SaveMigrationCommand } from './model/commands/SaveMigrationCommand'

class ProjectInitializer {
	constructor(
		private readonly systemDb: Client,
		private readonly stageTree: StageTree,
		private readonly projectMigrator: ProjectMigrator,
		private readonly rebaseExecutor: RebaseExecutor,
		private readonly projectMigrationInfoResolver: ProjectMigrationInfoResolver,
		private readonly stageCreator: StageCreator,
		private readonly providers: UuidProvider,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async initialize() {
		await setupSystemVariables(this.systemDb, unnamedIdentity, this.providers)
		await this.createInitEvent()
		await this.initStages()
	}

	private async createInitEvent() {
		const rowCount = new CreateInitEventCommand(this.providers).execute(this.systemDb)
		if (rowCount) {
			console.log(`Created init event`)
		}
	}

	private async initStages() {
		const root = this.stageTree.getRoot()
		await this.upgradeSchemaMigrations(root.slug)

		const createStage = async (parent: StageConfig | null, stage: StageConfig) => {
			const created = await this.stageCreator.createStage(parent, stage)
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
		const schema = await this.schemaVersionBuilder.buildSchema()
		console.group(`Executing project migrations`)
		await this.runMigrations(schema)
		console.groupEnd()
	}

	private async runMigrations(schema: Schema) {
		const {
			migrationsToExecute,
			migrationsDirectory,
			allMigrations,
			badMigrations,
		} = await this.projectMigrationInfoResolver.getMigrationsInfo()

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

		await this.rebaseExecutor.rebaseAll()
		await this.projectMigrator.migrate(schema, migrationsToExecute, version =>
			console.log(`Executing migration ${version}`),
		)
	}

	private async upgradeSchemaMigrations(stage: string) {
		const migrationEvents = await this.systemDb.createQueryHandler().fetch(new MigrationEventsQuery(stage))
		const { allMigrations, executedMigrations } = await this.projectMigrationInfoResolver.getMigrationsInfo()
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
			await new SaveMigrationCommand(migration).execute(this.systemDb)
		}
		console.groupEnd()
	}
}

export default ProjectInitializer
