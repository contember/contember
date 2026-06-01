import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { InvalidSchemaException } from '@contember/schema-migrations'
import prompts from 'prompts'
import { MigrationCreator, MigrationsResolver, SchemaStateManager, SchemaVersionBuilder } from '@contember/migrations-client'
import { SchemaLoader } from '../../lib/schema/SchemaLoader.js'
import { MigrationPrinter } from '../../lib/migrations/MigrationPrinter.js'
import { MigrationExecutionFacade } from '../../lib/migrations/MigrationExecutionFacade.js'
import { printValidationErrors } from '../../lib/schema/SchemaValidationPrinter.js'

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
		private readonly migrationsResolver: MigrationsResolver,
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
		let stateMode = await this.schemaStateManager.isStateMode()

		// New project (no migrations yet) defaults to schema state mode. To opt out, create a migration first (e.g. `migrations:blank`).
		if (!stateMode && (await this.migrationsResolver.getSchemaMigrations()).length === 0) {
			console.log('No migrations found — enabling schema state mode for this project.')
			console.log('ACL, validation, actions and settings will be managed in the state/ directory instead of migrations.')
			await this.schemaStateManager.extractState(schema)
			stateMode = true
		}

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
