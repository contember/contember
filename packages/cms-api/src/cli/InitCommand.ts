import Knex from 'knex'
import Project from '../config/Project'
import KnexConnection from '../core/knex/KnexConnection'
import BaseCommand from './BaseCommand'
import CommandConfiguration from '../core/cli/CommandConfiguration'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import { setupSystemVariables } from '../system-api/SystemVariablesSetupHelper'
import CreateStageCommand from '../system-api/model/commands/CreateStageCommand'
import CreateInitEventCommand from '../system-api/model/commands/CreateInitEventCommand'
import CreateProjectCommand from '../tenant-api/model/commands/CreateProjectCommand'
import StageMigrator from '../system-api/StageMigrator'
import KnexWrapper from '../core/knex/KnexWrapper'

const identityId = '11111111-1111-1111-1111-111111111111'

class Initialize {
	constructor(
		private readonly tenantDb: KnexWrapper,
		private readonly projectDb: KnexWrapper,
		private readonly project: Project,
		private readonly migrationFilesManager: MigrationFilesManager
	) {}

	public async createOrUpdateProject() {
		new CreateProjectCommand(this.project).execute(this.tenantDb)
		console.log(`Project ${this.project.slug} updated`)
	}

	public async createInitEvent() {
		const rowCount = new CreateInitEventCommand().execute(this.projectDb)
		if (rowCount) {
			console.log(`Created init event for project ${this.project.slug}`)
		}
	}

	public async initStages() {
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
		await setupSystemVariables(this.projectDb, identityId)
		try {
			const result = await new StageMigrator(this.migrationFilesManager).migrate(stage, this.projectDb, filename =>
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

type Args = {
	configFileName: string
	projectsDir: string
}

class InitCommand extends BaseCommand<Args, {}> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.name('init')
	}

	protected async execute(): Promise<void> {
		const config = await this.readConfig()

		const tenantDb = new KnexConnection(
			Knex({
				debug: false,
				client: 'pg',
				connection: config.tenant.db,
			}),
			'tenant'
		).wrapper()

		await Promise.all(
			config.projects.map(async project => {
				const migrationFilesManager = MigrationFilesManager.createForProject(
					this.getGlobalOptions().projectsDirectory,
					project.slug
				)
				const projectDb = new KnexConnection(
					Knex({
						debug: false,
						client: 'pg',
						connection: project.dbCredentials,
					}),
					'system'
				).wrapper()

				await setupSystemVariables(projectDb, identityId)

				const init = new Initialize(tenantDb, projectDb, project, migrationFilesManager)
				await init.createOrUpdateProject()
				await init.createInitEvent()
				await init.initStages()
			})
		)
	}
}

export default InitCommand
