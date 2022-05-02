import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import { printValidationErrors } from '../../utils/schema'
import { InvalidSchemaException } from '@contember/schema-migrations'
import { configureCreateMigrationCommand, executeCreateMigrationCommand } from './MigrationCreateHelper'
import { createMigrationStatusTable, printMigrationDescription } from '../../utils/migrations'
import { executeMigrations, resolveMigrationStatus } from './MigrationExecuteHelper'
import prompts from 'prompts'
import { interactiveResolveApiToken, TenantClient } from '../../utils/tenant'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { SystemClient } from '../../utils/system'
import { loadSchema } from '../../utils/project/loadSchema'

type Args = {
	project: string
	migrationName: string
}

type Options = {
	execute?: true
	yes?: true
}

export class MigrationDiffCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Creates schema migration diff for given project')
		configureCreateMigrationCommand(configuration)
		configuration.option('execute').valueNone()
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
			}) => {
				const schema = await loadSchema(project)
				try {
					const migrationName = input.getArgument('migrationName')
					const initialSchema = await schemaVersionBuilder.buildSchema()
					const result = await migrationCreator.prepareMigration(initialSchema, schema, migrationName)
					if (result === null) {
						console.log('Nothing to do')
						return 0
					}
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
					const filename = await migrationCreator.saveMigration(result.migration)

					console.log(`${filename} created`)

					if (shouldExecute) {
						const instance = await interactiveResolveInstanceEnvironmentFromInput(workspace)
						const apiToken = await interactiveResolveApiToken({ workspace, instance })
						const tenantClient = TenantClient.create(instance.baseUrl, apiToken)
						await tenantClient.createProject(project.name, true)
						const systemClient = SystemClient.create(instance.baseUrl, project.name, apiToken)

						const status = await resolveMigrationStatus(systemClient, migrationsResolver)
						if (status.errorMigrations.length > 0) {
							console.error(createMigrationStatusTable(status.errorMigrations))
							throw `Cannot execute migrations`
						}
						await executeMigrations({
							client: systemClient,
							migrations: status.migrationsToExecute,
							requireConfirmation: status.migrationsToExecute.length > 1 && !yes,
							schemaVersionBuilder,
							migrationDescriber,
						})
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
