import CreateInitEventCommand from './model/commands/CreateInitEventCommand'
import CreateStageCommand from './model/commands/CreateStageCommand'
import { setupSystemVariables, unnamedIdentity } from './SystemVariablesSetupHelper'
import Project from '../config/Project'
import StageMigrator from './StageMigrator'
import KnexWrapper from '../core/knex/KnexWrapper'

class ProjectInitializer {
	constructor(
		private readonly projectDb: KnexWrapper,
		private readonly project: Project,
		private readonly stageMigrator: StageMigrator,
	) {
	}

	public async initialize()
	{
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
		await Promise.all(
			this.project.stages.map(async stage => {
				await this.createStage(stage)
				await this.runMigrationsForStage(stage)
			})
		)
	}

	private async createStage(stage: Project.Stage) {
		await this.projectDb.transaction(async wrapper => {
			await new CreateStageCommand(stage).execute(wrapper)
			console.log(`Updated stage ${stage.slug} of project ${this.project.slug}`)
		})
	}

	private async runMigrationsForStage(stage: Project.Stage) {
		await setupSystemVariables(this.projectDb, unnamedIdentity)
		try {
			const result = await this.stageMigrator.migrate(stage, filename =>
				console.log(`Executing migration ${filename} for project ${this.project.slug} (stage ${stage.slug})`)
			)

			if (result.count === 0) {
				console.log(`No migrations to execute for project ${this.project.slug} (stage ${stage.slug})`)
			}
		} catch (e) {
			if (e instanceof StageMigrator.MigrationError) {
				e.message = `${this.project.name} - ${stage.name}: ${e.message}`
			}
			throw e
		}
	}
}

export default ProjectInitializer
