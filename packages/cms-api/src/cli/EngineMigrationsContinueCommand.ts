import MigrationFilesManager from '../migrations/MigrationFilesManager'
import BaseCommand from './BaseCommand'
import CommandConfiguration from '../core/cli/CommandConfiguration'
import MigrationsRunner from '../migrations/MigrationsRunner'

class EngineMigrationsContinueCommand extends BaseCommand<{}, {}> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.name('engine:migrations:continue')
		configuration.description('Runs migrations of tenant api and system schema in projects')
	}

	protected async execute(): Promise<void> {
		const config = await this.readConfig()

		console.log('Executing tenant schema migrations')

		const migrationsRunner = new MigrationsRunner()
		const tenantMigrationsManager = MigrationFilesManager.createForEngine('tenant')
		await migrationsRunner.migrate(config.tenant.db, 'tenant', tenantMigrationsManager.directory)

		console.log('\n')
		const projectMigrationsManager = MigrationFilesManager.createForEngine('project')
		for (const project of config.projects) {
			console.log(`Executing event schema migrations for project ${project.slug}`)
			await migrationsRunner.migrate(project.dbCredentials, 'system', projectMigrationsManager.directory)
			console.log('\n')
		}
	}
}

export default EngineMigrationsContinueCommand
