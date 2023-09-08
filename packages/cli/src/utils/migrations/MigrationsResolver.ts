import { MigrationFilesManager } from './MigrationFilesManager'
import { Migration } from '@contember/schema-migrations'
import { isSchemaMigration, MigrationFile } from './MigrationFile'
import { MigrationVersionHelper } from '@contember/engine-common'

export class MigrationsResolver {

	constructor(private readonly migrationFilesManager: MigrationFilesManager) {}

	public get directory(): string {
		return this.migrationFilesManager.directory
	}

	public async getMigrationFiles(): Promise<MigrationFile[]> {
		return await this.migrationFilesManager.readFiles()
	}

	public async getSchemaMigrations(): Promise<Migration[]> {
		const migrationFiles = await this.getMigrationFiles()

		const migrations = await Promise.all(migrationFiles.map(this.convertMigrationFileToSchemaMigration))

		return migrations.filter((it): it is Migration => it !== null)
	}

	public async findLatestSchemaMigration(): Promise<Migration | null> {
		const migrations = await this.getSchemaMigrations()
		return migrations.length > 0 ? migrations[migrations.length - 1] : null
	}

	public async findSchemaMigrationByVersion(version: string): Promise<Migration | null> {
		const migrations = await this.getSchemaMigrations()
		return migrations
			.find(it =>
				MigrationVersionHelper.extractVersion(it.version) === MigrationVersionHelper.extractVersion(version),
			)
			?? null
	}

	private async convertMigrationFileToSchemaMigration(file: MigrationFile): Promise<Migration | null> {
		const result = await file.getContent()
		return isSchemaMigration(result) ? result : null
	}
}
