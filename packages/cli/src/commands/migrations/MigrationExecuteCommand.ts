import { Command, CommandConfiguration, Input, Workspace } from '@contember/cli-common'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import {
	configureExecuteMigrationCommand,
	ExecuteMigrationOptions,
	executeMigrations,
	resolveMigrationStatus,
} from './MigrationExecuteHelper'
import { createMigrationStatusTable, findMigration, MigrationState } from '../../utils/migrations'
import { assertNever } from '../../utils/assertNever'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { interactiveResolveApiToken, TenantClient } from '../../utils/tenant'
import { SystemClient } from '../../utils/system'

type Args = {
	project: string
	migration?: string
}

type Options = ExecuteMigrationOptions & {
	force: boolean
}

export class MigrationExecuteCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Executes migrations on an instance')
		configuration.argument('project')
		configuration.argument('migration').optional()
		configuration.option('force').description('Ignore migrations order and missing migrations (dev only)')
		configureExecuteMigrationCommand(configuration)
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const projectName = input.getArgument('project')

		const workspace = await Workspace.get(process.cwd())
		const project = await workspace.projects.getProject(projectName, { fuzzy: true })
		const migrationsDir = await project.migrationsDir
		const container = new MigrationsContainerFactory(migrationsDir).create()
		const migrationArg = input.getArgument('migration')

		const instance = await interactiveResolveInstanceEnvironmentFromInput(workspace, input?.getOption('instance'))
		const apiToken = await interactiveResolveApiToken({ instance })
		const remoteProject = input?.getOption('remote-project') || project.name
		const tenantClient = await TenantClient.create(instance.baseUrl, apiToken)
		await tenantClient.createProject(remoteProject, true)
		const systemClient = SystemClient.create(instance.baseUrl, remoteProject, apiToken)

		const force = input.getOption('force')
		const status = await resolveMigrationStatus(systemClient, container.migrationsResolver, force)
		if (status.errorMigrations.length > 0) {
			console.error(createMigrationStatusTable(status.errorMigrations))
			if (!force) {
				throw `Cannot execute migrations`
			}
		}

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
				return status.migrationsToExecute
			}
		})()
		if (migrations.length === 0) {
			console.log('No migrations to execute')
			return 0
		}

		return await executeMigrations({
			migrationDescriber: container.migrationDescriber,
			schemaVersionBuilder: container.schemaVersionBuilder,
			client: systemClient,
			migrations,
			requireConfirmation: !input.getOption('yes'),
			force: force,
		})
	}
}
