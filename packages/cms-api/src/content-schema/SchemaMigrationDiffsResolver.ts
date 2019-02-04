import MigrationFilesManager from '../migrations/MigrationFilesManager'
import FileNameHelper from '../migrations/FileNameHelper'
import ProjectSchemaInfo from '../config/ProjectSchemaInfo'

class SchemaMigrationDiffsResolver {
	constructor(private readonly migrationFilesManager: MigrationFilesManager) {}

	public async resolve(): Promise<ProjectSchemaInfo.Migration[]> {
		return (await this.migrationFilesManager.readFiles('json'))
			.map(it => ({
				name: it.filename,
				diff: JSON.parse(it.content),
			}))
			.map(({ name, diff }) => ({ version: FileNameHelper.extractVersion(name), diff }))
	}
}

export default SchemaMigrationDiffsResolver
