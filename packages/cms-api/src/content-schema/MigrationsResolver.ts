import MigrationFilesManager from '../migrations/MigrationFilesManager'
import Migration from '../system-api/model/migrations/Migration'

class MigrationsResolver {
	private migrations: Promise<Migration[]>

	constructor(private readonly migrationFilesManager: MigrationFilesManager) {
		this.migrations = this.createMigrations()
	}

	public async getMigrations(): Promise<Migration[]> {
		return await this.migrations
	}

	private async createMigrations(): Promise<Migration[]> {
		return (await this.migrationFilesManager.readFiles('json'))
			.map(({ version, content }) => ({
				version,
				...JSON.parse(content),
			}))

	}
}

export default MigrationsResolver
