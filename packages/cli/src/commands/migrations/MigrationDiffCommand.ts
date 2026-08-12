import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { InvalidSchemaException } from '@contember/schema-migrations'
import prompts from 'prompts'
import { MigrationCreator, MigrationsResolver, SchemaStateManager, SchemaVersionBuilder } from '@contember/migrations-client'
import { SchemaLoader } from '../../lib/schema/SchemaLoader.js'
import { MigrationPrinter } from '../../lib/migrations/MigrationPrinter.js'
import { MigrationExecutionFacade } from '../../lib/migrations/MigrationExecutionFacade.js'
import { printValidationErrors } from '../../lib/schema/SchemaValidationPrinter.js'

type MigrationExecutor = Pick<MigrationExecutionFacade, 'execute'>

type Args = {
	migrationName: string
}

type Options = {
	execute?: true
	yes?: true
	'skip-initial-schema-validation'?: true
	'recreate-views'?: true
}

export class MigrationDiffCommand extends Command<Args, Options> {
	constructor(
		private readonly schemaLoader: SchemaLoader,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly migrationCreator: MigrationCreator,
		private readonly migrationPrinter: MigrationPrinter,
		private readonly migrationExecutorFacade: MigrationExecutor,
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
		configuration //
			.option('recreate-views')
			.valueNone()
			.description(
				'Drop & recreate changed views instead of updating them in-place (CREATE OR REPLACE VIEW). Use when an in-place view update fails with SQLSTATE 42P16.',
			)
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void> {
		const migrationName = input.getArgument('migrationName')
		let shouldExecute = input.getOption('execute')
		const yes = input.getOption('yes')
		const skipInitialSchemaValidation = input.getOption('skip-initial-schema-validation') === true
		const recreateViews = input.getOption('recreate-views') === true

		const schema = await this.schemaLoader.loadSchema()
		let stateMode = await this.schemaStateManager.isStateMode()
		let initializeStateMode = false

		// New project (no migrations yet) defaults to schema state mode. To opt out, create a migration first (e.g. `migrations blank`).
		if (!stateMode && (await this.migrationsResolver.getSchemaMigrations()).length === 0) {
			output.info('No migrations found — enabling schema state mode for this project.')
			output.info('ACL, validation, actions and settings will be managed in the state/ directory instead of migrations.')
			stateMode = true
			initializeStateMode = true
		}

		try {
			const initialSchema = await this.schemaVersionBuilder.buildSchema()
			const result = await this.migrationCreator.prepareMigration(initialSchema, schema, migrationName, {
				skipInitialSchemaValidation: skipInitialSchemaValidation,
				skipNonModelDiffers: stateMode,
				recreateViews,
			})

			const schemaState = stateMode ? SchemaStateManager.schemaStateFromSchema(schema) : undefined
			const stateChanged = schemaState ? await this.schemaStateManager.writeState(schemaState, { dryRun: true }) : false

			if (result === null) {
				if (stateChanged) {
					if (!yes) {
						if (!output.canPrompt()) {
							throw new CliError('TTY not available. Pass --yes to confirm the schema state update.', {
								code: 'TTY_UNAVAILABLE',
								exitCode: ExitCode.InputError,
							})
						}
						const { confirmed } = await prompts({
							type: 'confirm',
							name: 'confirmed',
							message: 'Write the schema state changes?',
							initial: false,
						})
						if (confirmed !== true) {
							throw abortedError('Schema state update')
						}
					}
					if (schemaState === undefined) {
						throw new CliError('Schema state is unavailable', { code: 'SCHEMA_STATE_UNAVAILABLE', exitCode: ExitCode.InternalError })
					}
					if (initializeStateMode) {
						await this.schemaStateManager.extractState(schema)
					} else {
						await this.schemaStateManager.writeState(schemaState)
					}
				} else {
					output.info('Nothing to do')
				}
				if (stateChanged && shouldExecute) {
					output.info('Syncing schema state to server...')
					await this.migrationExecutorFacade.execute({
						force: false,
						requireConfirmation: false,
					})
				}
				output.data(
					{ migration: null, stateUpdated: stateChanged, executed: stateChanged && shouldExecute === true },
					{ human: value => value.stateUpdated ? 'Schema state updated' : 'Nothing to do', quiet: value => value.stateUpdated },
				)
				return
			}
			this.migrationPrinter.printMigrationDescription(result.initialSchema, result.migration, { noSql: true })

			if (!yes) {
				if (!output.canPrompt()) {
					throw new CliError('TTY not available. Pass --yes to confirm execution.', {
						code: 'TTY_UNAVAILABLE',
						exitCode: ExitCode.InputError,
					})
				}
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
					throw abortedError('Migration creation')
				}
				if (action === 'execute') {
					shouldExecute = true
				}
			}

			const filename = await this.migrationCreator.saveMigration(result.migration)
			if (stateChanged) {
				if (schemaState === undefined) {
					throw new CliError('Schema state is unavailable', { code: 'SCHEMA_STATE_UNAVAILABLE', exitCode: ExitCode.InternalError })
				}
				if (initializeStateMode) {
					await this.schemaStateManager.extractState(schema)
				} else {
					await this.schemaStateManager.writeState(schemaState)
				}
			}
			if (stateChanged) {
				output.info('Schema state files updated')
			}

			if (shouldExecute) {
				await this.migrationExecutorFacade.execute({
					force: false,
					requireConfirmation: false,
				})
			}
			output.data(
				{ migration: filename, stateUpdated: stateChanged, executed: shouldExecute === true },
				{ human: value => `${value.migration} created`, quiet: value => value.migration },
			)
		} catch (e) {
			if (e instanceof InvalidSchemaException) {
				printValidationErrors(e.validationErrors, e.message, output)
				throw new CliError(e.message, {
					code: 'SCHEMA_INVALID',
					exitCode: ExitCode.InputError,
					details: e.validationErrors,
					cause: e,
				})
			}
			throw e
		}
	}
}

const abortedError = (operation: string): CliError =>
	new CliError(`${operation} aborted`, {
		code: 'OPERATION_ABORTED',
		exitCode: ExitCode.InputError,
	})
