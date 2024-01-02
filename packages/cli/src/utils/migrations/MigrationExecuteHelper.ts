import { CommandConfiguration } from '@contember/cli-common'
import {
	ContentMigrationFactoryArgs,
	isSchemaMigration,
	MigrationDescriber,
	MigrationsResolver,
	MigrationToExecuteOkStatus,
	SchemaVersionBuilder,
	SystemClient,
	MigrationExecutor,
	MigrationsStatusResolver,
} from '@contember/migrations-client'
import { printMigrationDescription } from './migrations'
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
) => {
	const migrationStatusResolver = new MigrationsStatusResolver()
	const executedMigrations = await client.listExecutedMigrations()
	const localMigrations = await migrationsResolver.getMigrationFiles()
	return migrationStatusResolver.getMigrationsStatus(executedMigrations, localMigrations, force)
}

export const executeMigrations = async ({
	client,
	migrations,
	requireConfirmation,
	schemaVersionBuilder,
	migrationDescriber,
	contentMigrationFactoryArgs,
	force,
}: {
	client: SystemClient
	migrations: MigrationToExecuteOkStatus[]
	requireConfirmation: boolean
	schemaVersionBuilder: SchemaVersionBuilder
	migrationDescriber: MigrationDescriber
	contentMigrationFactoryArgs: ContentMigrationFactoryArgs
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
					const migrationContent = await migration.localMigration.getContent()
					if (!isSchemaMigration(migrationContent)) {
						continue
					}

					await printMigrationDescription(migrationDescriber, schema, migrationContent, {
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

	const executor = new MigrationExecutor()

	await executor.executeMigrations({
		client,
		migrations,
		contentMigrationFactoryArgs,
		log: message => console.log(message),
		force,
	})
	return 0
}
