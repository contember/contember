import { assertNever, Command, CommandConfiguration, Input } from '../../cli'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { getProjectDirectories } from '../../NamingHelper'
import {
	createMigrationStatusTable,
	findMigration,
	getMigrationsStatus,
	MigrationState,
	printMigrationDescription,
} from '../../utils/migrations'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { interactiveResolveApiToken } from '../../utils/tenant'
import { SystemClient } from '../../utils/system'
import prompts from 'prompts'

type Args = {
	project: string
	migration?: string
}

type Options = {
	instance?: string
	['remote-project']?: string
	yes?: true
}

export class MigrationExecuteCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Executes migrations on an instance')
		configuration.argument('project')
		configuration.argument('migration').optional()
		configuration
			.option('instance')
			.valueRequired()
			.description('Local instance name or remote Contember API URL')
		configuration
			.option('remote-project')
			.valueRequired()
			.description('Specify this when remote project name does not match local project name.')
		configuration
			.option('yes')
			.valueNone()
			.description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const projectName = input.getArgument('project')

		const { migrationsDir } = getProjectDirectories(projectName)
		const container = new MigrationsContainerFactory(migrationsDir).create()

		const instance = await interactiveResolveInstanceEnvironmentFromInput(input.getOption('instance'))
		const apiToken = await interactiveResolveApiToken({ instance })
		const remoteProject = input.getOption('remote-project') || projectName
		const client = SystemClient.create(instance.baseUrl, remoteProject, apiToken)

		const executedMigrations = await client.listExecutedMigrations()
		const localMigrations = await container.migrationsResolver.getMigrations()
		const status = getMigrationsStatus(executedMigrations, localMigrations)
		const migrationArg = input.getArgument('migration')

		const migrations = (() => {
			if (migrationArg) {
				const migration = findMigration(status.allMigrations, migrationArg)
				if (!migration) {
					throw `Undefined migration ${migrationArg}`
				}
				switch (migration.state) {
					case MigrationState.EXECUTED_OK:
						throw `Migration ${migrationArg} is already executed`
					case MigrationState.TO_EXECUTE_ERROR:
					case MigrationState.EXECUTED_ERROR:
					case MigrationState.EXECUTED_MISSING:
						throw `Cannot execute migration ${migrationArg}: ${migration.errorMessage} (${migration.state})`
					case MigrationState.TO_EXECUTE_OK:
						return [migration]
					default:
						assertNever(migration)
				}
			} else {
				if (status.errorMigrations.length > 0) {
					console.error(createMigrationStatusTable(status.errorMigrations))
					throw `Cannot execute migrations`
				}
				return status.migrationsToExecute
			}
		})()
		if (migrations.length === 0) {
			console.log('No migrations to execute')
			return 0
		}
		console.log('Will execute following migrations:')
		migrations.forEach(it => console.error(it.name))
		if (!input.getOption('yes')) {
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
					const schema = await container.schemaVersionBuilder.buildSchemaUntil(migrations[0].version)
					for (const migration of migrations) {
						await printMigrationDescription(container.migrationsDescriber, schema, migration.localMigration, {
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
}
