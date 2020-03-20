import { Command, CommandConfiguration, Input } from '../../cli'
import { Schema } from '@contember/schema'
import { printValidationErrors } from '../../utils/schema'
import { InvalidSchemaException } from '@contember/schema-migrations'
import { configureCreateMigrationCommand, executeCreateMigrationCommand } from './MigrationCreateMigrationHelper'

type Args = {
	projectName: string
	migrationName: string
}

type Options = {
	['migrations-dir']?: string
	['project-dir']?: string
}

export class MigrationsDiffCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates schema migration diff for given project')
		configureCreateMigrationCommand(configuration)
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		await executeCreateMigrationCommand(input, async ({ projectDir, migrationName, migrationCreator }) => {
			const schema: Schema = require(projectDir).default
			try {
				const result = await migrationCreator.createDiff(schema, migrationName)
				if (result === null) {
					console.log('Nothing to do')
				} else {
					console.log(`${result} created`)
				}
			} catch (e) {
				if (e instanceof InvalidSchemaException) {
					printValidationErrors(e.validationErrors, e.message)
					return
				}
				throw e
			}
		})
	}
}
