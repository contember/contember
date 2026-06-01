import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { InvalidSchemaException, SchemaMigrator } from '@contember/schema-migrations'
import prompts from 'prompts'
import { emptySchema } from '@contember/schema-utils'
import { MigrationCreator, MigrationsResolver, SchemaStateManager, SchemaVersionBuilder } from '@contember/migrations-client'
import { MigrationsStatusFacade } from '../../lib/migrations/MigrationsStatusFacade'
import { SchemaLoader } from '../../lib/schema/SchemaLoader'
import { MigrationsValidator } from '../../lib/migrations/MigrationsValidator'
import { MigrationPrinter } from '../../lib/migrations/MigrationPrinter'
import { printValidationErrors } from '../../lib/schema/SchemaValidationPrinter'
import { SystemClientProvider } from '../../lib/SystemClientProvider'

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

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const migrationName = input.getArgument('migration')
		const amendMigration = migrationName
			? await this.migrationsResolver.findSchemaMigrationByVersion(migrationName)
			: await this.migrationsResolver.findLatestSchemaMigration()
		if (!amendMigration) {
			throw 'No migration to amend'
		}
		const force = input.getOption('force')
		const status = await this.migrationsStatusFacade.resolveMigrationsStatus({ force })
		if (status.migrationsToExecute.length > 0) {
			throw `Some migrations are not executed. Unable to amend.`
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
					await this.schemaStateManager.writeState(schemaState!)
					console.log('Schema state updated (no model changes)')
				} else {
					console.log('Nothing to do')
				}
				return 0
			}
			if (amendMigration.formatVersion !== intermediateResult.migration.formatVersion) {
				throw 'Incompatible migration format version'
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
				throw `Cannot amend migration`
			}

			this.migrationPrinter.printMigrationDescription(
				intermediateResult.initialSchema,
				intermediateResult.migration,
				{ noSql: true },
			)
			console.log(`Amending ${amendMigration.name}`)
			if (!(await this.shouldContinue(input))) {
				console.log('Aborting')
				return 1
			}
			const systemClient = this.systemApiClientProvider.get()
			await systemClient.migrate([intermediateResult.migration], force)
			await systemClient.migrationDelete(intermediateResult.migration.version)

			if (!newMigrationResult && await this.shouldRemove()) {
				await this.migrationCreator.removeMigration(amendMigration.name)
				await systemClient.migrationDelete(amendMigration.version)
				if (schemaState) {
					await this.schemaStateManager.writeState(schemaState)
					// migrationDelete rebuilds the server schema from migrations, dropping the
					// non-model state; re-apply it so the server stays in sync with the state files.
					await systemClient.migrate([], force, schemaState)
				}
				console.log('Latest migration was removed')
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

			return 0
		} catch (e) {
			if (e instanceof InvalidSchemaException) {
				printValidationErrors(e.validationErrors, e.message)
				return 1
			}
			throw e
		}
	}

	private async shouldContinue(input: Input<{}, { yes?: true }>): Promise<boolean> {
		const yes = input.getOption('yes')
		if (yes) {
			return true
		}
		const { action } = await prompts({
			type: 'select',
			name: 'action',
			message: 'Do you want to continue?',
			choices: [
				{ value: 'yes', title: 'Yes' },
				{ value: 'no', title: 'Abort' },
			],
		})
		return action === 'yes'
	}

	private async shouldRemove(): Promise<boolean> {
		const { action } = await prompts({
			type: 'select',
			name: 'action',
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
