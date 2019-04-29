import CreateInitEventCommand from './model/commands/CreateInitEventCommand'
import { setupSystemVariables, unnamedIdentity } from './SystemVariablesSetupHelper'
import Project from '../config/Project'
import Client from '../core/database/Client'
import ProjectMigrator from './model/migrations/ProjectMigrator'
import RebaseExecutor from './model/events/RebaseExecutor'
import ProjectMigrationInfoResolver from './model/migrations/ProjectMigrationInfoResolver'
import StageCreator from './model/stages/StageCreator'
import StageTree from './model/stages/StageTree'
import { StageWithoutEvent } from './model/dtos/Stage'

class ProjectInitializer {
	constructor(
		private readonly projectDb: Client,
		private readonly project: Project,
		private readonly stageTree: StageTree,
		private readonly projectMigrator: ProjectMigrator,
		private readonly rebaseExecutor: RebaseExecutor,
		private readonly projectMigrationInfoResolver: ProjectMigrationInfoResolver,
		private readonly stageCreator: StageCreator
	) {}

	public async initialize() {
		await setupSystemVariables(this.projectDb, unnamedIdentity)
		await this.createInitEvent()
		await this.initStages()
	}

	private async createInitEvent() {
		const rowCount = new CreateInitEventCommand().execute(this.projectDb)
		if (rowCount) {
			console.log(`Created init event for project ${this.project.slug}`)
		}
	}

	private async initStages() {
		const root = this.stageTree.getRoot()
		const createStage = async (parent: StageWithoutEvent | null, stage: StageWithoutEvent) => {
			const created = await this.stageCreator.createStage(parent, stage)
			if (created) {
				console.log(`Created stage ${stage.slug} of project ${this.project.slug}`)
			} else {
				console.log(`Updated stage ${stage.slug} of project ${this.project.slug}`)
			}
		}
		const createRecursive = async (parent: StageWithoutEvent | null, stage: StageWithoutEvent) => {
			await createStage(parent, stage)
			for (const childStage of this.stageTree.getChildren(stage)) {
				await createRecursive(stage, childStage)
			}
		}
		await createRecursive(null, root)

		await this.runMigrations()
	}

	private async runMigrations() {
		const { currentVersion, migrationsToExecute } = await this.projectMigrationInfoResolver.getMigrationsInfo()

		if (migrationsToExecute.length === 0) {
			console.log(`No migrations to execute for project ${this.project.slug}`)
			return
		}
		await this.rebaseExecutor.rebaseAll()

		await this.projectMigrator.migrate(currentVersion, migrationsToExecute, version =>
			console.log(`Executing migration ${version} for project ${this.project.slug} `)
		)
	}
}

export default ProjectInitializer
