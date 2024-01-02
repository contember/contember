import { Command, CommandConfiguration, Input, pathExists, Workspace } from '@contember/cli-common'
import {
	configureExecuteMigrationCommand,
	ExecuteMigrationOptions,
	executeMigrations,
	resolveMigrationStatus,
} from '../../utils/migrations/MigrationExecuteHelper'
import { interactiveResolveApiToken, TenantClient } from '../../utils/tenant'
import { interactiveResolveInstanceEnvironmentFromInput } from '../../utils/instance'
import { SystemClient } from '@contember/migrations-client'
import { MigrationsContainerFactory } from '../../utils/migrations/MigrationsContainer'
import { AdminClient, readAdminFiles } from '../../utils/admin'
import prompts from 'prompts'
import { createMigrationStatusTable } from '../../utils/migrations/migrations'
import { maskToken } from '../../utils/token'
import { parseDsn } from '../../utils/dsn'

type Args = {
	dsn: string
	project?: string
}

type Options = ExecuteMigrationOptions & {
	admin?: string
	['no-admin']?: boolean
	['no-migrations']?: boolean
	root?: boolean
}

export class DeployCommand extends Command<Args, Options> {
	constructor(
		private readonly workspace: Workspace,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Deploy Contember project')
		configuration.argument('dsn')

		if (!this.workspace.isSingleProjectMode()) {
			configuration.argument('project').optional()
		}

		configuration.option('admin').valueRequired()
		configuration.option('root').valueNone()
		configuration.option('no-admin').valueNone()
		configuration.option('no-migrations').valueNone()

		configureExecuteMigrationCommand(configuration)
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {
		const [dsn, projectName] = this.getNormalizedInput(input)
		const project = await this.workspace.projects.getProject(projectName, { fuzzy: true })

		let apiUrl = input.getOption('instance')
		let adminEndpoint = input.getOption('admin')

		let apiTokenFromDsn: string | undefined = undefined

		let remoteProject = input.getOption('remote-project') || project.name

		if (dsn) {
			({ project: remoteProject, endpoint: adminEndpoint, token: apiTokenFromDsn  } = parseDsn(dsn))
		}

		const instance = await interactiveResolveInstanceEnvironmentFromInput(this.workspace, apiUrl ?? (adminEndpoint ? adminEndpoint + '/_api' : undefined))
		const apiToken = await interactiveResolveApiToken({ workspace: this.workspace, instance, apiToken: apiTokenFromDsn })

		console.log('')
		console.log('Contember project deployment configuration:')
		console.log(`Local project name: ${project.name}`)
		console.log(`Target project name: ${remoteProject}`)
		console.log(`API URL: ${instance.baseUrl}`)
		console.log(`Admin URL: ${adminEndpoint ?? 'none'}`)
		console.log(`Deploy token: ${maskToken(apiToken)}`)
		console.log('')

		const projectAdminDistDir = `${project.adminDir}/dist`

		const noAdmin = input.getOption('no-admin') === true

		if (adminEndpoint && !noAdmin && !(await pathExists(`${projectAdminDistDir}/index.html`))) {
			throw `Missing ${projectAdminDistDir}/index.html. Please build admin before deploying.`
		}

		if (input.getOption('no-migrations') !== true) {
			const migrationsDir = project.migrationsDir
			const container = new MigrationsContainerFactory(migrationsDir).create()

			const tenantClient = TenantClient.create(instance.baseUrl, apiToken)
			await tenantClient.createProject(remoteProject, true)
			const systemClient = SystemClient.create(instance.baseUrl, remoteProject, apiToken)

			const status = await resolveMigrationStatus(systemClient, container.migrationsResolver, false)

			if (status.errorMigrations.length > 0) {
				console.error(createMigrationStatusTable(status.errorMigrations))
				throw `Cannot execute migrations`
			}

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
				console.log(adminEndpoint && !noAdmin ? 'Admin will be deployed.' : 'Admin will NOT be deployed.')
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
				contentMigrationFactoryArgs: {
					apiToken,
					apiBaseUrl: instance.baseUrl.replace(/\/$/, ''),
					projectName: remoteProject,
				},
			})

			if (migrationExitCode !== 0) {
				return migrationExitCode
			}
		}

		if (adminEndpoint && !noAdmin) {
			console.log('Deploying admin...')

			const client = AdminClient.create(adminEndpoint, apiToken)
			const files = await readAdminFiles(projectAdminDistDir)

			// in some cases you need deploy whole folder with custom build etc.
			// with root option you can build app on your own and simply deploy it with subprojects
			await client.deploy(
				input.getOption('root') ? null : remoteProject, files,
			)

			console.log(`Admin deployed (${files.length} files)`)
		}

		console.log('')
		console.log('Deployment successful')
		console.log(`API URL: ${instance.baseUrl}`)
		console.log(`Admin URL: ${adminEndpoint ?? 'none'}`)

		return 0
	}

	private getNormalizedInput(input: Input<Args, Options>): [string | undefined, string | undefined] {
		const projectOrDsnInput = input.getArgument('dsn')
		const secondInput = input.getArgument('project')

		const isUriLike = projectOrDsnInput.includes('://')
		const dsn = isUriLike ? projectOrDsnInput : undefined
		const projectName = !isUriLike ? projectOrDsnInput : secondInput
		return [dsn, projectName]
	}
}
