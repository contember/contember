import Command from '../core/cli/Command'
import CommandConfiguration from '../core/cli/CommandConfiguration'
import { Schema } from '@contember/schema'
import { ProjectContainerResolver } from '../CompositionRoot'
import { SchemaValidator } from '@contember/schema-utils'
import { isDeepStrictEqual } from 'util'
import { Input } from '../core/cli/Input'

type Args = {
	projectName: string
	migrationName: string
}

class DiffCommand extends Command<Args, {}> {
	constructor(
		private readonly projectContainerResolver: ProjectContainerResolver,
		private readonly schemas: { [name: string]: Schema },
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Creates .json schema migration for given project')
		configuration.argument('projectName')
		configuration.argument('migrationName')
	}

	protected async execute(input: Input<Args, {}>): Promise<void> {
		const [projectName, migrationName] = [input.getArgument('projectName'), input.getArgument('migrationName')]

		const projectContainer = this.projectContainerResolver(projectName)
		if (!projectContainer) {
			throw new Error(`Undefined project ${projectName}`)
		}

		const executionContainer = projectContainer.systemExecutionContainerFactory.create(projectContainer.systemDbClient)
		const migrationDiffCreator = executionContainer.migrationDiffCreator
		const schema = this.schemas[projectName]
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

		const result = await migrationDiffCreator.createDiff(schema, migrationName)

		if (result === null) {
			console.log('Nothing to do')
			return
		}

		console.log(`${result} created`)
	}
}

export default DiffCommand
