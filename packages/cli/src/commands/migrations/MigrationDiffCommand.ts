import { Command, CommandConfiguration, Input } from '../../cli'
import { Schema } from '@contember/schema'
import { printValidationErrors } from '../../utils/schema'
import { InvalidSchemaException } from '@contember/schema-migrations'
import { configureCreateMigrationCommand, executeCreateMigrationCommand } from './MigrationCreateHelper'
import { createMigrationStatusTable, printMigrationDescription } from '../../utils/migrations'
import { configureExecuteMigrationCommand, executeMigrations, resolveMigrationStatus } from './MigrationExecuteHelper'
import { resolveSystemApiClient } from './SystemApiClientResolver'
import prompts from 'prompts'

type Args = {
	project: string
	migrationName: string
}

type Options = {
	['migrations-dir']?: string
	['project-dir']?: string
	execute?: true
	instance?: string
	['remote-project']?: string
	yes?: true
}

export class MigrationDiffCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates schema migration diff for given project')
		configureCreateMigrationCommand(configuration)
		configuration.option('execute').valueNone()
		configureExecuteMigrationCommand(configuration)
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		return await executeCreateMigrationCommand(
			input,
			async ({
				schemaVersionBuilder,
				migrationsResolver,
				workspace,
				project,
				migrationName,
				migrationCreator,
				migrationDescriber,
			}) => {
				// eslint-disable-next-line @typescript-eslint/no-var-requires
				const schema: Schema = require(project.apiDir).default
				try {
					const result = await migrationCreator.prepareDiff(schema, migrationName)
					if (result === null) {
						console.log('Nothing to do')
					} else {
						await printMigrationDescription(migrationDescriber, result.initialSchema, result.migration, { noSql: true })
						const yes = input.getOption('yes')
						let shouldExecute = input.getOption('execute')
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
								return 1
							}
							if (action === 'execute') {
								shouldExecute = true
							}
						}
						const filename = await migrationCreator.saveDiff(result.migration)

						console.log(`${filename} created`)

						if (shouldExecute) {
							const client = await resolveSystemApiClient(workspace, project, input)
							const status = await resolveMigrationStatus(client, migrationsResolver)
							if (status.errorMigrations.length > 0) {
								console.error(createMigrationStatusTable(status.errorMigrations))
								throw `Cannot execute migrations`
							}
							await executeMigrations({
								client,
								migrations: status.migrationsToExecute,
								requireConfirmation: !yes,
								schemaVersionBuilder,
								migrationDescriber,
							})
						}
					}
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
}
