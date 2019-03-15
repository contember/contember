import MigrationFilesManager from '../migrations/MigrationFilesManager'
import Migration from '../system-api/model/migrations/Migration'

class MigrationsResolver {
	constructor(private readonly migrationFilesManager: MigrationFilesManager) {
	}

	public async resolve(): Promise<Migration[]> {
		return (await this.migrationFilesManager.readFiles('json'))
			.map(({ version, content }) => ({
				version,
				...JSON.parse(content),
			}))
	}
}

export default MigrationsResolver
