import { Command, CommandConfiguration, Input } from '../../cli'
import { Schema } from '@contember/schema'
import { printValidationErrors } from '../../utils/schema'
import { InvalidSchemaException } from '@contember/schema-migrations'
import { executeCreateMigrationCommand } from './MigrationCreateHelper'
import {
	createMigrationStatusTable,
	getLatestMigration,
	getMigrationByName,
	printMigrationDescription,
} from '../../utils/migrations'
import { resolveMigrationStatus } from './MigrationExecuteHelper'
import { resolveSystemApiClient } from './SystemApiClientResolver'
import prompts from 'prompts'
import { emptySchema } from '@contember/schema-utils'
import { validateMigrations } from './MigrationValidationHelper'

type Args = {
	project: string
	migration?: string
}

type Options = {
	yes?: true
	force: boolean
}

export class MigrationAmendCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Amends latest migration')
		configuration.argument('project')
		configuration.argument('migration').optional()
		configuration.option('force').description('Ignore migrations order and missing migrations (dev only)')
		configuration //
			.option('yes')
			.valueNone()
			.description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		return await executeCreateMigrationCommand(
			input,
			async ({
				schemaVersionBuilder,
				migrationsResolver,
				workspace,
				project,
				migrationCreator,
				migrationDescriber,
				schemaMigrator,
			}) => {
				const migrationName = input.getArgument('migration')
				const amendMigration = migrationName
					? await getMigrationByName(migrationsResolver, migrationName)
					: await getLatestMigration(migrationsResolver)
				if (!amendMigration) {
					throw 'No migration to amend'
				}
				const client = await resolveSystemApiClient(workspace, project)
				const status = await resolveMigrationStatus(client, migrationsResolver)
				const force = input.getOption('force')
				if (status.errorMigrations.length > 0) {
					console.error(createMigrationStatusTable(status.errorMigrations))
					if (!force) {
						throw `Cannot execute migrations`
					}
				}
				if (status.migrationsToExecute.length > 0) {
					throw `Some migrations are not executed. Unable to amend.`
				}
				// eslint-disable-next-line @typescript-eslint/no-var-requires
				const schema: Schema = require(project.apiDir).default
				try {
					const initialSchema = await schemaVersionBuilder.buildSchema()
					const intermediateResult = await migrationCreator.prepareMigration(initialSchema, schema, '')
					if (intermediateResult === null) {
						console.log('Nothing to do')
						return 0
					}
					if (amendMigration.formatVersion !== intermediateResult.migration.formatVersion) {
						throw 'Incompatible migration format version'
					}
					const prevSchema = await schemaVersionBuilder.buildSchemaAdvanced(
						emptySchema,
						version => version < amendMigration.version,
					)
					const newSchema = await schemaMigrator.applyModifications(
						prevSchema,
						[...amendMigration.modifications, ...intermediateResult.migration.modifications],
						amendMigration.formatVersion,
					)
					const newMigrationResult = await migrationCreator.prepareMigration(prevSchema, newSchema, '')
					const followingMigrations = (await migrationsResolver.getMigrations()).filter(
						it => it.version > amendMigration.version,
					)

					const valid = await validateMigrations(
						prevSchema,
						[...(newMigrationResult ? [newMigrationResult.migration] : []), ...followingMigrations],
						migrationDescriber,
						schemaMigrator,
					)
					if (!valid) {
						throw `Cannot amend migration`
					}

					await printMigrationDescription(
						migrationDescriber,
						intermediateResult.initialSchema,
						intermediateResult.migration,
						{ noSql: true },
					)
					console.log(`Amending ${amendMigration.name}`)
					if (!(await this.shouldContinue(input))) {
						console.log('Aborting')
						return 1
					}
					await client.migrate([intermediateResult.migration], force)
					await client.migrationDelete(intermediateResult.migration.version)

					if (!newMigrationResult) {
						await migrationCreator.removeMigration(amendMigration.name)
						await client.migrationDelete(amendMigration.version)
						console.log('Latest migration was removed')
						return 0
					}
					const newMigration = {
						name: amendMigration.name,
						version: amendMigration.version,
						formatVersion: newMigrationResult.migration.formatVersion,
						modifications: newMigrationResult.migration.modifications,
					}
					await migrationCreator.saveMigration(newMigration)
					await client.migrationModify(amendMigration.version, newMigration)

					return 0
				} catch (e) {
					if (e instanceof InvalidSchemaException) {
						printValidationErrors(e.validationErrors, e.message)
						return 1
					}
					throw e
				}
			},
		)
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
}
