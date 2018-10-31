import pgMigrate from 'node-pg-migrate'
import { DatabaseCredentials } from '../tenant-api/config'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import BaseCommand from './BaseCommand'
import CommandConfiguration from '../core/cli/CommandConfiguration'


class EngineMigrationsContinueCommand extends BaseCommand<{}, {}> {

	protected configure(configuration: CommandConfiguration): void {
		configuration.name('engine:migrations:continue')
		configuration.description('Runs migrations of tenant api and system schema in projects')
	}

	protected async execute(): Promise<void> {
		const config = await this.readConfig()

		console.log('Executing tenant schema migrations')
		const tenantMigrationsManager = MigrationFilesManager.createForEngine('tenant')
		await this.migrate(config.tenant.db, 'tenant', tenantMigrationsManager.directory)

		console.log('\n')
		const projectMigrationsManager = MigrationFilesManager.createForEngine('project')
		for (const project of config.projects) {
			console.log(`Executing event schema migrations for project ${project.slug}`)
			await this.migrate(project.dbCredentials, 'system', projectMigrationsManager.directory)
			console.log('\n')
		}
	}

	private async migrate(db: DatabaseCredentials, schema: string, dir: string) {
		await pgMigrate({
			databaseUrl: db,
			dir: dir,
			schema: schema,
			migrationsTable: 'migrations',
			checkOrder: true,
			direction: 'up',
			count: Infinity,
			ignorePattern: '^\\..*$',
			createSchema: true,
			singleTransaction: true,
			log: (msg: string) => {
				console.log('    ' + msg.replace(/\n/g, '\n    '))
			},
		})
	}
}

export default EngineMigrationsContinueCommand
