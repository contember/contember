import { CliError, Command, CommandConfiguration, ExitCode, Input, Output } from '@contember/cli-common'
import { InvalidSchemaException, SchemaMigrator } from '@contember/schema-migrations'
import { emptySchema } from '@contember/schema-utils'
import { MigrationCreator, MigrationsResolver, SchemaStateManager, SchemaVersionBuilder } from '@contember/migrations-client'
import { MigrationsStatusFacade } from '../../lib/migrations/MigrationsStatusFacade.js'
import { SchemaLoader } from '../../lib/schema/SchemaLoader.js'
import { MigrationsValidator } from '../../lib/migrations/MigrationsValidator.js'
import { MigrationPrinter } from '../../lib/migrations/MigrationPrinter.js'
import { printValidationErrors } from '../../lib/schema/SchemaValidationPrinter.js'
import { SystemClientProvider } from '../../lib/SystemClientProvider.js'
import { promptSelect } from '../../lib/prompt/index.js'

type Args = {
	migration?: string
}

type Options = {
	yes?: true
	force: boolean
}

export class MigrationAmendCommand extends Command<Args, Options> {
	constructor(
		private readonly migrationsResolver: MigrationsResolver,
		private readonly systemApiClientProvider: SystemClientProvider,
		private readonly migrationsStatusFacade: MigrationsStatusFacade,
		private readonly schemaLoader: SchemaLoader,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly migrationCreator: MigrationCreator,
		private readonly migrationsValidator: MigrationsValidator,
		private readonly migrationPrinter: MigrationPrinter,
		private readonly schemaMigrator: SchemaMigrator,
		private readonly schemaStateManager: SchemaStateManager,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Amends latest migration')
		configuration.argument('migration').optional()
		configuration.option('force').description('Ignore migrations order and missing migrations (dev only)')
		configuration //
			.option('yes')
			.valueNone()
			.description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<number> {
		const migrationName = input.getArgument('migration')
		const amendMigration = migrationName
			? await this.migrationsResolver.findSchemaMigrationByVersion(migrationName)
			: await this.migrationsResolver.findLatestSchemaMigration()
		if (!amendMigration) {
			throw new CliError('No migration to amend', { code: 'MIGRATION_NOT_FOUND', exitCode: ExitCode.NotFound })
		}
		const force = input.getOption('force')
		const status = await this.migrationsStatusFacade.resolveMigrationsStatus({ force })
		if (status.migrationsToExecute.length > 0) {
			throw new CliError('Some migrations are not executed. Unable to amend.', {
				code: 'MIGRATIONS_NOT_EXECUTED',
				exitCode: ExitCode.InputError,
			})
		}

		const schema = await this.schemaLoader.loadSchema()
		const stateMode = await this.schemaStateManager.isStateMode()
		try {
			const initialSchema = await this.schemaVersionBuilder.buildSchema()
			const intermediateResult = await this.migrationCreator.prepareMigration(initialSchema, schema, '', {
				skipNonModelDiffers: stateMode,
			})

			const schemaState = stateMode ? SchemaStateManager.schemaStateFromSchema(schema) : undefined
			const stateChanged = schemaState ? await this.schemaStateManager.writeState(schemaState, { dryRun: true }) : false

			if (intermediateResult === null) {
				if (stateChanged) {
					if (!(await this.shouldContinue(input, output))) {
						throw abortedError('Migration amendment')
					}
					if (schemaState === undefined) {
						throw new CliError('Schema state is unavailable', { code: 'SCHEMA_STATE_UNAVAILABLE', exitCode: ExitCode.InternalError })
					}
					await this.schemaStateManager.writeState(schemaState)
				} else {
					output.info('Nothing to do')
				}
				output.data(
					{ migration: amendMigration.name, stateUpdated: stateChanged, changed: stateChanged },
					{ human: value => value.changed ? 'Schema state updated (no model changes)' : 'Nothing to do', quiet: value => value.migration },
				)
				return 0
			}
			if (amendMigration.formatVersion !== intermediateResult.migration.formatVersion) {
				throw new CliError('Incompatible migration format version', {
					code: 'MIGRATION_FORMAT_INCOMPATIBLE',
					exitCode: ExitCode.InputError,
				})
			}
			const prevSchema = await this.schemaVersionBuilder.buildSchemaAdvanced(
				emptySchema,
				version => version < amendMigration.version,
			)
			const newSchema = await this.schemaMigrator.applyModifications(
				prevSchema,
				[...amendMigration.modifications, ...intermediateResult.migration.modifications],
				amendMigration.formatVersion,
			)
			const newMigrationResult = await this.migrationCreator.prepareMigration(prevSchema, newSchema, '', {
				skipNonModelDiffers: stateMode,
			})
			const followingMigrations = (await this.migrationsResolver.getSchemaMigrations()).filter(
				it => it.version > amendMigration.version,
			)

			const valid = await this.migrationsValidator.validate(
				prevSchema,
				[...(newMigrationResult ? [newMigrationResult.migration] : []), ...followingMigrations],
			)
			if (!valid) {
				throw new CliError('Cannot amend migration', { code: 'MIGRATIONS_INVALID', exitCode: ExitCode.InputError })
			}

			this.migrationPrinter.printMigrationDescription(
				intermediateResult.initialSchema,
				intermediateResult.migration,
				{ noSql: true },
			)
			output.info(`Amending ${amendMigration.name}`)
			if (!(await this.shouldContinue(input, output))) {
				throw abortedError('Migration amendment')
			}
			const systemClient = this.systemApiClientProvider.get()
			await systemClient.migrate([intermediateResult.migration], force)
			await systemClient.migrationDelete(intermediateResult.migration.version)

			if (!newMigrationResult && await this.shouldRemove(input, output)) {
				await this.migrationCreator.removeMigration(amendMigration.name)
				await systemClient.migrationDelete(amendMigration.version)
				if (schemaState) {
					await this.schemaStateManager.writeState(schemaState)
					// migrationDelete rebuilds the server schema from migrations, dropping the
					// non-model state; re-apply it so the server stays in sync with the state files.
					await systemClient.migrate([], force, schemaState)
				}
				output.data(
					{ migration: amendMigration.name, removed: true, stateUpdated: schemaState !== undefined },
					{ human: () => 'Latest migration was removed', quiet: value => value.migration },
				)
				return 0
			}
			const newMigration = {
				name: amendMigration.name,
				version: amendMigration.version,
				formatVersion: newMigrationResult?.migration.formatVersion ?? amendMigration.formatVersion,
				modifications: newMigrationResult?.migration.modifications ?? [],
			}
			await this.migrationCreator.saveMigration(newMigration)
			await systemClient.migrationModify(amendMigration.version, newMigration)

			if (schemaState) {
				await this.schemaStateManager.writeState(schemaState)
				// migrationModify rebuilds the server schema from migrations, dropping the
				// non-model state; re-apply it so the server stays in sync with the state files.
				await systemClient.migrate([], force, schemaState)
			}
			output.data(
				{ migration: amendMigration.name, removed: false, stateUpdated: schemaState !== undefined },
				{ human: value => `Amended ${value.migration}`, quiet: value => value.migration },
			)

			return 0
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

	private async shouldContinue(input: Input<{}, { yes?: true }>, output: Output): Promise<boolean> {
		const yes = input.getOption('yes')
		if (yes) {
			return true
		}
		assertCanPrompt(output)
		const action = await promptSelect(output, {
			message: 'Do you want to continue?',
			choices: [
				{ value: 'yes', title: 'Yes' },
				{ value: 'no', title: 'Abort' },
			],
		})
		return action === 'yes'
	}

	/** With --yes the migration is kept and emptied — removing a file that others may have already executed is not safe to assume. */
	private async shouldRemove(input: Input<{}, { yes?: true }>, output: Output): Promise<boolean> {
		if (input.getOption('yes')) {
			return false
		}
		assertCanPrompt(output)
		const action = await promptSelect(output, {
			message:
				'The amendment results in a no-op migration because the changes introduced by the latest migration were reverted.\nYou can choose to remove the latest migration or to modify it so it is empty.',
			choices: [
				{ value: 'remove', title: 'Remove latest migration' },
				{ value: 'keep', title: 'Keep latest migration and make it empty' },
			],
		})
		return action === 'remove'
	}
}

const abortedError = (operation: string): CliError =>
	new CliError(`${operation} aborted`, {
		code: 'OPERATION_ABORTED',
		exitCode: ExitCode.InputError,
	})

const assertCanPrompt = (output: Output): void => {
	if (!output.canPrompt()) {
		throw new CliError('TTY not available. Pass --yes to confirm execution.', {
			code: 'TTY_UNAVAILABLE',
			exitCode: ExitCode.InputError,
		})
	}
}
