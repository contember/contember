import CreateInitEventCommand from './model/commands/CreateInitEventCommand'
import { setupSystemVariables, unnamedIdentity } from './SystemVariablesSetupHelper'
import { ProjectConfig, StageConfig } from './types'
import { Client } from '@contember/database'
import ProjectMigrator from './model/migrations/ProjectMigrator'
import RebaseExecutor from './model/events/RebaseExecutor'
import ProjectMigrationInfoResolver from './model/migrations/ProjectMigrationInfoResolver'
import StageCreator from './model/stages/StageCreator'
import StageTree from './model/stages/StageTree'
import { UuidProvider } from './utils/uuid'

class ProjectInitializer {
	constructor(
		private readonly projectDb: Client,
		private readonly project: ProjectConfig,
		private readonly stageTree: StageTree,
		private readonly projectMigrator: ProjectMigrator,
		private readonly rebaseExecutor: RebaseExecutor,
		private readonly projectMigrationInfoResolver: ProjectMigrationInfoResolver,
		private readonly stageCreator: StageCreator,
		private readonly providers: UuidProvider,
	) {}

	public async initialize() {
		await setupSystemVariables(this.projectDb, unnamedIdentity, this.providers)
		await this.createInitEvent()
		await this.initStages()
	}

	private async createInitEvent() {
		const rowCount = new CreateInitEventCommand(this.providers).execute(this.projectDb)
		if (rowCount) {
			console.log(`${this.project.slug}: Created init event for project`)
		}
	}

	private async initStages() {
		const root = this.stageTree.getRoot()
		const createStage = async (parent: StageConfig | null, stage: StageConfig) => {
			const created = await this.stageCreator.createStage(parent, stage)
			if (created) {
				console.log(`${this.project.slug}: Created stage ${stage.slug} `)
			} else {
				console.log(`${this.project.slug}: Updated stage ${stage.slug}`)
			}
		}
		const createRecursive = async (parent: StageConfig | null, stage: StageConfig) => {
			await createStage(parent, stage)
			for (const childStage of this.stageTree.getChildren(stage)) {
				await createRecursive(stage, childStage)
			}
		}
		await createRecursive(null, root)

		await this.runMigrations()
	}

	private async runMigrations() {
		const {
			currentVersion,
			migrationsToExecute,
			migrationsDirectory,
			allMigrations,
		} = await this.projectMigrationInfoResolver.getMigrationsInfo()

		console.log(`${this.project.slug}: reading migrations from directory "${migrationsDirectory}"`)
		if (allMigrations.length === 0) {
			console.warn(`${this.project.slug}: No migrations for project found.`)
			return
		}

		if (migrationsToExecute.length === 0) {
			console.log(`${this.project.slug}: No migrations to execute for project`)
			return
		}
		await this.rebaseExecutor.rebaseAll()

		await this.projectMigrator.migrate(currentVersion, migrationsToExecute, version =>
			console.log(`${this.project.slug}: Executing migration ${version}`),
		)
	}
}

export default ProjectInitializer
