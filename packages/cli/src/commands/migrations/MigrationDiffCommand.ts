import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { InvalidSchemaException } from '@contember/schema-migrations'
import prompts from 'prompts'
import { MigrationCreator, SchemaStateManager, SchemaVersionBuilder } from '@contember/migrations-client'
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
		private readonly schemaStateManager: SchemaStateManager,
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
		const stateMode = await this.schemaStateManager.isStateMode()

		try {
			const initialSchema = await this.schemaVersionBuilder.buildSchema()
			const result = await this.migrationCreator.prepareMigration(initialSchema, schema, migrationName, {
				skipInitialSchemaValidation: skipInitialSchemaValidation,
				skipNonModelDiffers: stateMode,
			})

			const schemaState = stateMode ? SchemaStateManager.schemaStateFromSchema(schema) : undefined
			const stateChanged = schemaState ? await this.schemaStateManager.writeState(schemaState, { dryRun: true }) : false

			if (result === null) {
				if (stateChanged) {
					console.log('Schema state updated (no model changes)')
					await this.schemaStateManager.writeState(schemaState!)
				} else {
					console.log('Nothing to do')
				}
				if (stateChanged && shouldExecute) {
					console.log('Syncing schema state to server...')
					await this.migrationExecutorFacade.execute({
						force: false,
						requireConfirmation: false,
					})
				}
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
			if (stateChanged) {
				await this.schemaStateManager.writeState(schemaState!)
			}

			console.log(`${filename} created`)
			if (stateChanged) {
				console.log('Schema state files updated')
			}
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
				requireConfirmation: migrations => migrations.length !== 1 && !yes,
			})
		}
	}
}
