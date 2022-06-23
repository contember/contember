import { MigrationFilesManager } from './MigrationFilesManager.js'
import { VERSION_INITIAL } from './modifications/ModificationVersions.js'
import { MigrationVersionHelper } from './MigrationVersionHelper.js'
import { Migration } from './Migration.js'

export class MigrationsResolver {
	constructor(private readonly migrationFilesManager: MigrationFilesManager) {}

	public get directory(): string {
		return this.migrationFilesManager.directory
	}

	public async getMigrations(): Promise<Migration[]> {
		return (await this.migrationFilesManager.readFiles()).map(({ filename, content }) => {
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
