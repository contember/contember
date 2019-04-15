import MigrationFilesManager from '../migrations/MigrationFilesManager'
import CommandConfiguration from '../core/cli/CommandConfiguration'
import MigrationsRunner from '../core/migrations/MigrationsRunner'
import { Config } from '../config/config'
import Command from '../core/cli/Command'

class EngineMigrationsContinueCommand extends Command<{}, {}> {
	constructor(private readonly config: Config) {
		super()
	}

	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Runs migrations of tenant api and system schema in projects')
	}

	protected async execute(): Promise<void> {
		console.log('Executing tenant schema migrations')

		const migrationsRunner = new MigrationsRunner()
		const tenantMigrationsManager = MigrationFilesManager.createForEngine('tenant')
		await migrationsRunner.migrate(this.config.tenant.db, 'tenant', tenantMigrationsManager.directory)

		console.log('\n')
		const projectMigrationsManager = MigrationFilesManager.createForEngine('project')
		for (const project of this.config.projects) {
			console.log(`Executing event schema migrations for project ${project.slug}`)
			await migrationsRunner.migrate(project.dbCredentials, 'system', projectMigrationsManager.directory)
			console.log('\n')
		}
	}
}

export default EngineMigrationsContinueCommand
