import { MigrationFilesManager } from '@contember/engine-common'
import Migration from './Migration'
import { VERSION_INITIAL } from './modifications/ModificationVersions'

export class MigrationsResolver {
	private migrations: Promise<Migration[]>

	constructor(private readonly migrationFilesManager: MigrationFilesManager) {
		this.migrations = this.createMigrations()
	}

	public async getMigrations(): Promise<Migration[]> {
		return await this.migrations
	}

	private async createMigrations(): Promise<Migration[]> {
		return (await this.migrationFilesManager.readFiles('json')).map(({ version, content }) => {
			const parsed = JSON.parse(content)
			return {
				version,
				formatVersion: parsed.formatVersion || VERSION_INITIAL,
				modifications: parsed.modifications,
			}
		})
	}
}
