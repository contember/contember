import SchemaMigrator from '../content-schema/differ/SchemaMigrator'
import diffSchemas from '../content-schema/differ/diffSchemas'
import SqlMigrator from '../content-api/sqlSchema/SqlMigrator'
import Command from '../core/cli/Command'
import { emptySchema } from '../content-schema/modelUtils'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import CommandConfiguration from '../core/cli/CommandConfiguration'
import BaseCommand from './BaseCommand'

type Args = {
	projectName: string
	migrationName: string
}

class ProjectMigrationsDiffCommand extends BaseCommand<Args, {}> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.name('project:create-diff')
		configuration.description('Creates .json and .sql schema migration for given project')
		configuration.argument('projectName')
		configuration.argument('migrationName')
	}

	protected async execute(input: Command.Input<Args, {}>): Promise<void> {
		const [projectName, migrationName] = [input.getArgument('projectName'), input.getArgument('migrationName')]

		const migrationsFileManager = MigrationFilesManager.createForProject(
			this.getGlobalOptions().projectsDirectory,
			projectName
		)
		await migrationsFileManager.createDirIfNotExist()

		const modelFile = `${this.getGlobalOptions().workingDirectory}/dist/src/projects/${projectName}/src/model.js`

		const diffs = (await migrationsFileManager.readFiles('json')).map(it => JSON.parse(it.content))

		const currentSchema = diffs.reduce((schema, diff) => SchemaMigrator.applyDiff(schema, diff), emptySchema)

		const newSchema = await import(modelFile)

		const diff = diffSchemas(currentSchema, newSchema.default.model)
		if (diff === null) {
			console.log('Nothing to do')
			return
		}

		const sqlDiff = SqlMigrator.applyDiff(currentSchema, diff)
		const jsonDiff = JSON.stringify(diff, undefined, '\t')

		const result = await Promise.all([
			migrationsFileManager.createFile(jsonDiff, migrationName, 'json'),
			migrationsFileManager.createFile(sqlDiff, migrationName, 'sql'),
		])
		result.map(it => console.log(`${it} created`))
	}
}

export default ProjectMigrationsDiffCommand
