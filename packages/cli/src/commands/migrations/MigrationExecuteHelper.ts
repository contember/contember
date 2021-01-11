import { CommandConfiguration } from '../../cli'
import { SystemClient } from '../../utils/system'
import { getMigrationsStatus, MigrationToExecuteOkStatus, printMigrationDescription } from '../../utils/migrations'
import { MigrationDescriber, MigrationsResolver, SchemaVersionBuilder } from '@contember/schema-migrations'
import prompts from 'prompts'

export type ExecuteMigrationOptions = {
	instance?: string
	['remote-project']?: string
	yes?: true
}

export const configureExecuteMigrationCommand = (configuration: CommandConfiguration<{}, ExecuteMigrationOptions>) => {
	configuration //
		.option('instance')
		.valueRequired()
		.description('Local instance name or remote Contember API URL')
	configuration //
		.option('remote-project')
		.valueRequired()
		.description('Specify this when remote project name does not match local project name.')
	configuration //
		.option('yes')
		.valueNone()
		.description('Do not ask for confirmation.')
}

export const resolveMigrationStatus = async (
	client: SystemClient,
	migrationsResolver: MigrationsResolver,
): Promise<ReturnType<typeof getMigrationsStatus>> => {
	const executedMigrations = await client.listExecutedMigrations()
	const localMigrations = await migrationsResolver.getMigrations()
	return getMigrationsStatus(executedMigrations, localMigrations)
}

export const executeMigrations = async ({
	client,
	migrations,
	requireConfirmation,
	schemaVersionBuilder,
	migrationDescriber,
}: {
	client: SystemClient
	migrations: MigrationToExecuteOkStatus[]
	requireConfirmation: boolean
	schemaVersionBuilder: SchemaVersionBuilder
	migrationDescriber: MigrationDescriber
}) => {
	console.log('Will execute following migrations:')
	migrations.forEach(it => console.log(it.name))
	if (requireConfirmation) {
		if (!process.stdin.isTTY) {
			throw 'TTY not available. Pass --yes option to confirm execution.'
		}
		do {
			const { action } = await prompts({
				type: 'select',
				name: 'action',
				message: 'Do you want to continue?',
				choices: [
					{ value: 'yes', title: 'Execute migrations' },
					{ value: 'describe', title: 'Describe migrations' },
					{ value: 'no', title: 'Abort' },
				],
			})
			if (action === 'describe') {
				const schema = await schemaVersionBuilder.buildSchemaUntil(migrations[0].version)
				for (const migration of migrations) {
					await printMigrationDescription(migrationDescriber, schema, migration.localMigration, {
						noSql: true,
					})
				}
			} else if (action === 'yes') {
				break
			} else {
				return 1
			}
		} while (true)
	}

	const result = await client.migrate(migrations.map(it => it.localMigration))
	if (result.ok) {
		console.log('Migration executed')
		return 0
	}
	console.error(result.errors)
	return 1
}
