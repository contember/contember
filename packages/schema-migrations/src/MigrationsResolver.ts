import { MigrationFilesManager } from './MigrationFilesManager'
import { VERSION_INITIAL } from './modifications/ModificationVersions'
import { MigrationVersionHelper } from '@contember/engine-common'
import { Migration } from './Migration'

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
