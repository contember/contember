import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { SchemaValidator } from '@contember/schema-utils'
import { Schema } from '@contember/schema'
import { isDeepStrictEqual } from 'util'
import { Input } from '../cli/Input'
import { MigrationsContainerFactory } from '../MigrationsContainer'
import { getProjectDir, getProjectMigrationsDir } from '../NamingHelper'

type Args = {
	projectName: string
	migrationName: string
}

export class DiffCommand extends Command<Args, {}> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Creates .json schema migration for given project')
		configuration.argument('projectName')
		configuration.argument('migrationName')
	}

	protected async execute(input: Input<Args, {}>): Promise<void> {
		const [projectName, migrationName] = [input.getArgument('projectName'), input.getArgument('migrationName')]
		const projectDir = getProjectDir(projectName)
		const schema: Schema = require(projectDir).default

		const container = new MigrationsContainerFactory(getProjectMigrationsDir(projectName)).create()
		const validator = new SchemaValidator()
		const [validSchema, errors] = validator.validate(schema)

		if (errors.length === 0 && !isDeepStrictEqual(validSchema, schema)) {
			throw new Error('Something is wrong with a schema validator')
		}
		if (errors.length > 0) {
			console.error('Schema is invalid:')
			for (const err of errors) {
				console.error('\t' + err.path.join('.') + ': ' + err.message)
			}
			return
		}

		const result = await container.migrationDiffCreator.createDiff(schema, migrationName)

		if (result === null) {
			console.log('Nothing to do')
			return
		}

		console.log(`${result} created`)
	}
}
