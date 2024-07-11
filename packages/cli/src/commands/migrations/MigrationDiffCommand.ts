import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { InvalidSchemaException } from '@contember/schema-migrations'
import prompts from 'prompts'
import { MigrationCreator, SchemaVersionBuilder } from '@contember/migrations-client'
import { SchemaLoader } from '../../lib/schema/SchemaLoader'
import { MigrationPrinter } from '../../lib/migrations/MigrationPrinter'
import { MigrationExecutionFacade } from '../../lib/migrations/MigrationExecutionFacade'
import { printValidationErrors } from '../../lib/schema/SchemaValidationPrinter'

type Args = {
	migrationName: string
}

type Options = {
	execute?: true
	yes?: true
	'skip-initial-schema-validation'?: true
}

export class MigrationDiffCommand extends Command<Args, Options> {
	constructor(
		private readonly schemaLoader: SchemaLoader,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly migrationCreator: MigrationCreator,
		private readonly migrationPrinter: MigrationPrinter,
		private readonly migrationExecutorFacade: MigrationExecutionFacade,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates schema migration diff')
		configuration.argument('migrationName')
		configuration.option('execute').valueNone()
		configuration //
			.option('yes')
			.valueNone()
			.description('Do not ask for confirmation.')

		configuration.option('skip-initial-schema-validation')
	}

	protected async execute(input: Input<Args, Options>): Promise<void> {
		const migrationName = input.getArgument('migrationName')
		let shouldExecute = input.getOption('execute')
		const yes = input.getOption('yes')
		const skipInitialSchemaValidation = input.getOption('skip-initial-schema-validation') === true

		const schema = await this.schemaLoader.loadSchema()
		try {
			const initialSchema = await this.schemaVersionBuilder.buildSchema()
			const result = await this.migrationCreator.prepareMigration(initialSchema, schema, migrationName, {
				skipInitialSchemaValidation: skipInitialSchemaValidation,
			})
			if (result === null) {
				console.log('Nothing to do')
				return
			}
			this.migrationPrinter.printMigrationDescription(result.initialSchema, result.migration, { noSql: true })


			if (!yes) {
				const { action } = await prompts({
					type: 'select',
					name: 'action',
					message: 'Do you want to continue?',
					choices: [
						{ value: 'yes', title: 'Yes' },
						...(!shouldExecute ? [{ value: 'execute', title: 'Yes and execute immediately' }] : []),
						{ value: 'no', title: 'Abort' },
					],
				})
				if (!action || action === 'no') {
					console.log('Aborting')
					return
				}
				if (action === 'execute') {
					shouldExecute = true
				}
			}

			const filename = await this.migrationCreator.saveMigration(result.migration)

			console.log(`${filename} created`)

		} catch (e) {
			if (e instanceof InvalidSchemaException) {
				printValidationErrors(e.validationErrors, e.message)

				return
			}
			throw e
		}

		if (shouldExecute) {
			await this.migrationExecutorFacade.execute({
				force: false,
				requireConfirmation: !yes,
			})
		}
	}
}
