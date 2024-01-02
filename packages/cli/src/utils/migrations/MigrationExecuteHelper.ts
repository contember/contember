import { CommandConfiguration } from '@contember/cli-common'
import { SystemClient } from '../system'
import { getMigrationsStatus, MigrationToExecuteOkStatus, printMigrationDescription } from './migrations'
import { MigrationDescriber } from '@contember/schema-migrations'
import prompts from 'prompts'
import { MigrationsResolver } from './MigrationsResolver'
import { SchemaVersionBuilder } from './SchemaVersionBuilder'
import { ContentMigrationFactoryArgs, isSchemaMigration, ResolvedMigrationContent } from './MigrationFile'
import { assertNever } from '../assertNever'

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
	const localMigrations = await migrationsResolver.getMigrationFiles()
	return getMigrationsStatus(executedMigrations, localMigrations, force)
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

	let migrationsToRun: ResolvedMigrationContent[] = []

	const executeMigrations = async () => {
		if (migrationsToRun.length === 0) {
			return
		}
		await client.migrate(
			migrationsToRun.map(it => {
				if (it.type === 'schema') {
					return {
						version: it.version,
						name: it.name,
						type: 'SCHEMA',
						schemaMigration: {
							formatVersion: it.formatVersion,
							modifications: it.modifications,
							skippedErrors: it.skippedErrors,
						},
					}
				}
				if (it.type === 'content') {
					return {
						version: it.version,
						name: it.name,
						type: 'CONTENT',
						contentMigration: it.queries,
					}
				}
				return assertNever(it)
			}),
			force,
		)
		migrationsToRun.forEach(it => {
			console.log(it.name)
		})
		migrationsToRun = []
	}

	console.log('Executing...')

	for (const migration of migrations) {
		const migrationContent = await migration.localMigration.getContent()
		if (migrationContent.type === 'factory') {
			await executeMigrations()
			const result = await migrationContent.factory(contentMigrationFactoryArgs)
			migrationsToRun.push(result)
			await executeMigrations()
		} else {
			migrationsToRun.push(migrationContent)
		}
	}
	await executeMigrations()
	console.log('Migration executed')
	return 0
}
