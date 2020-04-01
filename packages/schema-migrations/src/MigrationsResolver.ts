import { MigrationFilesManager } from './MigrationFilesManager'
import { VERSION_INITIAL } from './modifications/ModificationVersions'
import { MigrationVersionHelper } from './MigrationVersionHelper'
import { Migration } from './Migration'

export class MigrationsResolver {
	private migrations: Promise<Migration[]>

	constructor(private readonly migrationFilesManager: MigrationFilesManager) {
		this.migrations = this.createMigrations()
	}

	public get directory(): string {
		return this.migrationFilesManager.directory
	}

	public async getMigrations(): Promise<Migration[]> {
		return await this.migrations
	}

	private async createMigrations(): Promise<Migration[]> {
		return (await this.migrationFilesManager.readFiles('json')).map(({ filename, content }) => {
			const parsed = JSON.parse(content)
			return {
				version: MigrationVersionHelper.extractVersion(filename),
				name: MigrationVersionHelper.extractName(filename),
				formatVersion: parsed.formatVersion || VERSION_INITIAL,
				modifications: parsed.modifications,
			}
		})
	}
}
