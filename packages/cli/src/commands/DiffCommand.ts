import Command from '../cli/Command'
import CommandConfiguration from '../cli/CommandConfiguration'
import { SchemaValidator } from '@contember/schema-utils'
import { Schema } from '@contember/schema'
import { isDeepStrictEqual } from 'util'
import { Input } from '../cli/Input'
import { MigrationsContainerFactory } from '../MigrationsContainer'
import { getProjectDirectories } from '../NamingHelper'

type Args = {
	projectName: string
	migrationName: string
}

type Options = {
	['migrations-dir']?: string
	['project-dir']?: string
}

export class DiffCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Creates .json schema migration for given project')
		configuration.argument('projectName')
		configuration.argument('migrationName')
		configuration.option('migrations-dir').valueRequired()
		configuration.option('project-dir').valueRequired()
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const [projectName, migrationName] = [input.getArgument('projectName'), input.getArgument('migrationName')]
		const { migrationsDir, projectDir } = getProjectDirectories(projectName, {
			projectDir: input.getOption('project-dir'),
			migrationsDir: input.getOption('migrations-dir'),
		})
		const schema: Schema = require(projectDir).default

		const container = new MigrationsContainerFactory(migrationsDir).create()
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
