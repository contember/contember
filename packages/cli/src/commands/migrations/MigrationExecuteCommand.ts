import { Command, CommandConfiguration, Input, Workspace } from '@contember/cli-common'
import { MigrationsContainerFactory } from '../../utils/migrations/MigrationsContainer'
import {
	configureExecuteMigrationCommand,
	ExecuteMigrationOptions,
	executeMigrations,
	resolveMigrationStatus,
} from '../../utils/migrations/MigrationExecuteHelper'
import { createMigrationStatusTable } from '../../utils/migrations/migrations'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { interactiveResolveApiToken, TenantClient } from '../../utils/tenant'
import { SystemClient } from '@contember/migrations-client'
import { MigrationVersionHelper } from '@contember/schema-migrations'

type Args = {
	project?: string
}

type Options = ExecuteMigrationOptions & {
	until?: string
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
		if (!this.workspace.isSingleProjectMode()) {
			configuration.argument('project')
		}
		configuration.option('force').description('Ignore migrations order and missing migrations (dev only)')
		configuration.option('until').valueRequired().description('Execute all migrations leading up to, and inclusive of, a specified migration')
		configureExecuteMigrationCommand(configuration)
	}

	protected async execute(input: Input<Args, Options>): Promise<number> {
		const projectName = input.getArgument('project')

		const workspace = this.workspace

		const allProjects = projectName === '.'
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
			const until = input.getOption('until')
			const untilNormalized = until ? MigrationVersionHelper.extractVersion(until) : null

			const migrations = untilNormalized
				? status.migrationsToExecute.filter(it => it.version <= MigrationVersionHelper.extractVersion(untilNormalized))
				: status.migrationsToExecute

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
				contentMigrationFactoryArgs: {
					apiToken,
					apiBaseUrl: instance.baseUrl.replace(/\/$/, ''),
					projectName: remoteProject,
				},
			})
			code ||= singleCode
		}
		return code
	}
}
