import { Command, CommandConfiguration, Input, Project, Workspace } from '@contember/cli-common'
import {
	configureExecuteMigrationCommand,
	ExecuteMigrationOptions,
	executeMigrations,
	resolveMigrationStatus,
} from '../migrations/MigrationExecuteHelper'
import { pathExists } from 'fs-extra'
import { interactiveResolveApiToken, TenantClient } from '../../utils/tenant'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { SystemClient } from '../../utils/system'
import { MigrationsContainerFactory } from '../../MigrationsContainer'
import { AdminClient, readAdminFiles } from '../../utils/admin'
import { URL } from 'url'
import prompts from 'prompts'
import { printMigrationDescription } from '../../utils/migrations'
import { maskToken } from '../../utils/token'

type Args = {
	dsn: string
	project?: string
}

type Options = ExecuteMigrationOptions & {
	admin?: string
}

export class DeployCommand extends Command<Args, Options> {
	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Deploy Contember project')
		configuration.argument('dsn')
		configuration.argument('project').optional()
		configuration.option('admin').valueRequired()
		configureExecuteMigrationCommand(configuration)
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const [dsn, projectName] = this.getNormalizedInput(input)
		const workspace = await Workspace.get(process.cwd())
		let project: Project

		let apiUrl = input.getOption('instance')
		let adminEndpoint = input.getOption('admin')

		let apiTokenFromDsn: string | undefined = undefined
		if (projectName) {
			project = await workspace.projects.getProject(projectName, { fuzzy: true })
		} else {
			const projects = await workspace.projects.listProjects()
			if (projects.length !== 1) {
				throw 'Please specify a local name project'
			}
			project = projects[0]
		}
		let remoteProject = input.getOption('remote-project') || project.name
		if (dsn) {
			const uri = new URL(dsn)
			if (uri.protocol !== 'contember:' && uri.protocol !== 'contember-unsecure:') {
				throw 'Invalid deploy URL'
			}
			remoteProject = uri.username
			apiTokenFromDsn = uri.password
			adminEndpoint = (uri.protocol === 'contember-unsecure:' ? 'http://' : 'https://') + uri.host
		}
		const instance = await interactiveResolveInstanceEnvironmentFromInput(workspace, apiUrl ?? (adminEndpoint ? adminEndpoint + '/_api' : undefined))
		const apiToken = await interactiveResolveApiToken({ workspace, instance, apiToken: apiTokenFromDsn })
		console.log('')
		console.log('Contember project deployment configuration:')
		console.log(`Local project name: ${project.name}`)
		console.log(`Target project name: ${remoteProject}`)
		console.log(`API URL: ${instance.baseUrl}`)
		console.log(`Admin URL: ${adminEndpoint ?? 'none'}`)
		console.log(`Deploy token: ${maskToken(apiToken)}`)
		console.log('')

		const migrationsDir = project.migrationsDir
		const container = new MigrationsContainerFactory(migrationsDir).create()

		const tenantClient = TenantClient.create(instance.baseUrl, apiToken)
		await tenantClient.createProject(remoteProject, true)
		const systemClient = SystemClient.create(instance.baseUrl, remoteProject, apiToken)

		const projectAdminDistDir = `${project.adminDir}/dist`
		if (adminEndpoint && !(await pathExists(`${projectAdminDistDir}/index.html`))) {
			throw `Missing ${projectAdminDistDir}/index.html. Please build admin before deploying.`
		}

		const status = await resolveMigrationStatus(systemClient, container.migrationsResolver, false)
		if (status.migrationsToExecute.length === 0 && !adminEndpoint) {
			console.log('Nothing to do.')
			return 0
		}
		if (!input.getOption('yes')) {
			if (!process.stdin.isTTY) {
				throw 'TTY not available. Pass --yes option to confirm execution.'
			}
			console.log('Following migrations will be executed:')
			console.log(status.migrationsToExecute.length ? status.migrationsToExecute.map(it => it.name).join(' ') : 'none')
			console.log(adminEndpoint ? 'Admin will be deployed.' : 'Admin will NOT be deployed.')
			console.log('(to skip this dialog, you can pass --yes option)')
			console.log('')
			const { ok } = await prompts({
				type: 'confirm',
				name: 'ok',
				message: `Do you want to continue?`,
			})
			 if (!ok) {
				return 1
			}
		}
		const migrationExitCode = await executeMigrations({
			migrationDescriber: container.migrationDescriber,
			schemaVersionBuilder: container.schemaVersionBuilder,
			client: systemClient,
			migrations: status.migrationsToExecute,
			requireConfirmation: false,
			force: false,
		})

		if (migrationExitCode !== 0) {
			return migrationExitCode
		}

		if (adminEndpoint) {
			console.log('Deploying admin:')
			const client = AdminClient.create(adminEndpoint, apiToken)
			const files = await readAdminFiles(projectAdminDistDir)
			files.forEach(it => console.log('  ' + it.path))
			await client.deploy(remoteProject, files)
			console.log('Admin deployed')
		}
		console.log('')
		console.log('Deployment successful')

		return 0
	}

	private getNormalizedInput(input: Input<Args, Options>): [string | undefined, string | undefined] {
		const projectOrDsnInput = input.getArgument('dsn')
		const secondInput = input.getArgument('project')

		const isUriLike = projectOrDsnInput.includes('://')
		const dsn = secondInput ?? (isUriLike ? projectOrDsnInput : undefined)
		const projectName = !isUriLike ? projectOrDsnInput : undefined
		return [dsn, projectName]
	}
}
