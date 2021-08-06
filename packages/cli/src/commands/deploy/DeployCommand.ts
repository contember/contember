import { Command, CommandConfiguration, Input, Workspace } from '@contember/cli-common'
import {
	configureExecuteMigrationCommand,
	ExecuteMigrationOptions,
	executeMigrations,
	resolveMigrationStatus,
} from '../migrations/MigrationExecuteHelper'
import { pathExists } from 'fs-extra'
import { readdir, readFile } from 'fs/promises'
import { interactiveResolveApiToken, TenantClient } from '../../utils/tenant'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { SystemClient } from '../../utils/system'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import fetch from 'node-fetch'

type Args = {
	project: string
}

type Options = ExecuteMigrationOptions & {
	admin?: string
}

export class DeployCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Deploy Contember project')
		configuration.argument('project')
		configureExecuteMigrationCommand(configuration)
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const projectName = input.getArgument('project')
		const adminEndpoint = input.getOption('admin')

		const workspace = await Workspace.get(process.cwd())
		const project = await workspace.projects.getProject(projectName, { fuzzy: true })
		const projectAdminDistDir = `${project.adminDir}/dist`
		const migrationsDir = project.migrationsDir
		const container = new MigrationsContainerFactory(migrationsDir).create()

		const instance = await interactiveResolveInstanceEnvironmentFromInput(workspace, input?.getOption('instance'))
		const apiToken = await interactiveResolveApiToken({ instance })
		const remoteProject = input?.getOption('remote-project') || project.name
		const tenantClient = TenantClient.create(instance.baseUrl, apiToken)
		await tenantClient.createProject(remoteProject, true)
		const systemClient = SystemClient.create(instance.baseUrl, remoteProject, apiToken)

		if (adminEndpoint && !(await pathExists(`${projectAdminDistDir}/index.html`))) {
			throw `Missing ${projectAdminDistDir}/index.html. Please build admin before deploying.`
		}

		const status = await resolveMigrationStatus(systemClient, container.migrationsResolver, false)

		const migrationExitCode = await executeMigrations({
			migrationDescriber: container.migrationDescriber,
			schemaVersionBuilder: container.schemaVersionBuilder,
			client: systemClient,
			migrations: status.migrationsToExecute,
			requireConfirmation: !input.getOption('yes'),
			force: false,
		})

		if (migrationExitCode !== 0) {
			return migrationExitCode
		}

		if (adminEndpoint) {
			const response = await fetch(`${adminEndpoint}/_deploy`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
				body: JSON.stringify({
					project: input.getOption('remote-project') ?? project.name,
					files: await this.readFiles(projectAdminDistDir),
				}),
			})

			if (!response.ok) {
				throw 'Failed to deploy admin'
			}
		}

		return 0
	}

	private async readFiles(dir: string, prefix: string = ''): Promise<Array<{ path: string; data: string }>> {
		const files = []

		for (const fileName of await readdir(dir, { withFileTypes: true })) {
			if (fileName.isDirectory()) {
				for (const innerFile of await this.readFiles(`${dir}/${fileName}`, prefix + fileName + '/')) {
					files.push(innerFile)
				}
			} else if (fileName.isFile()) {
				files.push({
					path: prefix + fileName,
					data: (await readFile(`${dir}/${fileName}`)).toString('base64'),
				})
			}
		}

		return files
	}
}
