import { CommandConfiguration } from '@contember/cli-common'
import { SystemClient } from '../../utils/system/index.js'
import { getMigrationsStatus, MigrationToExecuteOkStatus, printMigrationDescription } from '../../utils/migrations.js'
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
	force: boolean = false,
): Promise<ReturnType<typeof getMigrationsStatus>> => {
	const executedMigrations = await client.listExecutedMigrations()
	const localMigrations = await migrationsResolver.getMigrations()
	return getMigrationsStatus(executedMigrations, localMigrations, force)
}

export const executeMigrations = async ({
	client,
	migrations,
	requireConfirmation,
	schemaVersionBuilder,
	migrationDescriber,
	force,
}: {
	client: SystemClient
	migrations: MigrationToExecuteOkStatus[]
	requireConfirmation: boolean
	schemaVersionBuilder: SchemaVersionBuilder
	migrationDescriber: MigrationDescriber
	force?: boolean
}): Promise<number> => {
	if (migrations.length === 0) {
		return 0
	}
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

	await client.migrate(
		migrations.map(it => it.localMigration),
		force,
	)
	console.log('Migration executed')
	return 0
}
