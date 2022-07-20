import { Command, CommandConfiguration, Input, validateProjectName, Workspace } from '@contember/cli-common'
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
	constructor(
		private readonly workspace: Workspace,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Executes migrations on an instance')
		configuration.argument('project')
		configuration.argument('migration').optional()
		configuration.option('force').description('Ignore migrations order and missing migrations (dev only)')
		configureExecuteMigrationCommand(configuration)
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const projectName = input.getArgument('project')

		const workspace = this.workspace

		const allProjects = projectName === '.'
		if (!allProjects) {
			validateProjectName(projectName)
		}
		const remoteProjectOption = input?.getOption('remote-project')
		if (remoteProjectOption && allProjects) {
			throw 'Option remote-project can be used only for a single project'
		}
		const projects = allProjects
			? await workspace.projects.listProjects()
			: [await workspace.projects.getProject(projectName, { fuzzy: true })]

		let code = 0
		for (const project of projects) {
			const migrationsDir = project.migrationsDir
			const container = new MigrationsContainerFactory(migrationsDir).create()
			const migrationArg = input.getArgument('migration')

			const instance = await interactiveResolveInstanceEnvironmentFromInput(workspace, input?.getOption('instance'))
			const apiToken = await interactiveResolveApiToken({ workspace, instance })
			const remoteProject = remoteProjectOption || project.name
			const tenantClient = TenantClient.create(instance.baseUrl, apiToken)
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
				continue
			}

			const singleCode = await executeMigrations({
				migrationDescriber: container.migrationDescriber,
				schemaVersionBuilder: container.schemaVersionBuilder,
				client: systemClient,
				migrations,
				requireConfirmation: !input.getOption('yes'),
				force: force,
			})
			code ||= singleCode
		}
		return code
	}
}
