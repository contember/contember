import { CliError, Command, CommandConfiguration, escapeTerminalText, ExitCode, Input, Output } from '@contember/cli-common'
import { maskToken } from '../../lib/maskToken.js'
import { MigrationExecutionFacade } from '../../lib/migrations/MigrationExecutionFacade.js'
import { AdminDeployer } from '../../lib/admin/AdminDeployer.js'
import { FileSystem } from '../../lib/fs/FileSystem.js'
import { RemoteProject } from '../../lib/project/RemoteProject.js'
import { Workspace } from '../../lib/workspace/Workspace.js'
import { RemoteProjectProvider } from '../../lib/project/RemoteProjectProvider.js'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver.js'
import { promptConfirm } from '../../lib/prompt/index.js'

type Args = {
	dsn?: string
}

type Options = {
	admin?: string
	['no-admin']?: boolean
	['no-migrations']?: boolean
	root?: boolean
	yes?: boolean
	snapshot?: boolean
}

/** The result of a deploy, printed via `output.data` — the token is deliberately never part of it. */
export interface DeployResult {
	project: string
	apiUrl: string
	adminUrl: string | null
	migrationsDeployed: boolean
	adminDeployed: boolean
}

export class DeployCommand extends Command<Args, Options> {
	constructor(
		private readonly adminDeployer: AdminDeployer,
		// narrowed to the one method used: the real facade has a deep, partly-external dependency
		// graph that is impractical to construct for tests, and this keeps the DI wiring unchanged.
		private readonly migrationExecutionFacade: Pick<MigrationExecutionFacade, 'execute'>,
		private readonly fs: FileSystem,
		private readonly remoteProjectProvider: RemoteProjectProvider,
		private readonly remoteProjectResolver: RemoteProjectResolver,
		private readonly workspace: Workspace,
	) {
		super()
	}

	protected configure(configuration: CommandConfiguration<Args, Options>): void {
		configuration.description('Deploy Contember project')
		configuration.argument('dsn').optional()

		configuration.option('admin').valueRequired()
		configuration.option('root').valueNone()
		configuration.option('no-admin').valueNone()
		configuration.option('no-migrations').valueNone()
		configuration.option('snapshot')
			.valueNone()
			.description('Bootstrap an empty target database from snapshot.json instead of replaying every migration')
		configuration //
			.option('yes')
			.valueNone()
			.description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>, output: Output): Promise<void | number> {
		const dsn = input.getArgument('dsn')
		const adminEndpoint = input.getOption('admin')
		const remoteProject = this.remoteProjectResolver.resolve(dsn, adminEndpoint)
		if (!remoteProject) {
			throw new CliError('Project not defined. Please provide DSN or environment variables CONTEMBER_*', {
				code: 'PROJECT_NOT_DEFINED',
				exitCode: ExitCode.NotFound,
			})
		}
		this.remoteProjectProvider.setRemoteProject(remoteProject)

		const deployMigration = input.getOption('no-migrations') !== true
		const yes = input.getOption('yes') === true
		const projectAdminDistDir = this.workspace.adminDistDir

		const deployAdmin = input.getOption('no-admin') !== true && !!remoteProject.adminEndpoint && !!projectAdminDistDir

		output.info('')
		output.info('Contember project deployment configuration:')
		output.info(`Target project name: ${remoteProject.name}`)
		output.info(`API URL: ${remoteProject.endpoint}`)
		output.info(`Admin URL: ${remoteProject.adminEndpoint ?? 'none'}`)
		output.info(`Deploy token: ${maskToken(remoteProject.token)}`)
		output.info('')

		if (deployAdmin && !(await this.fs.pathExists(`${projectAdminDistDir}/index.html`))) {
			throw new CliError(`Missing ${projectAdminDistDir}/index.html. Please build admin before deploying.`, {
				code: 'ADMIN_BUILD_MISSING',
				exitCode: ExitCode.InputError,
				details: { path: `${projectAdminDistDir}/index.html` },
			})
		}

		let migrationsConfirmed = false
		let migrationsDeployed = false
		if (deployMigration) {
			migrationsDeployed = await this.migrationExecutionFacade.execute({
				force: false,
				requireConfirmation: !yes,
				additionalMessage: deployAdmin ? 'Admin will be deployed.' : 'Admin will NOT be deployed.',
				useSnapshot: input.getOption('snapshot') === true,
				onConfirmed: () => {
					migrationsConfirmed = true
				},
			})
		}

		let adminDeployed = false
		if (deployAdmin) {
			if (!migrationsDeployed && !migrationsConfirmed && !yes) {
				if (!output.canPrompt()) {
					throw new CliError('TTY not available. Pass --yes to confirm execution.', {
						code: 'TTY_UNAVAILABLE',
						exitCode: ExitCode.InputError,
					})
				}
				output.info('Admin will be deployed.')
				output.info('(to skip this dialog, you can pass --yes option)')
				output.info('')
				const ok = await promptConfirm(output, {
					message: `Do you want to continue?`,
				})
				if (!ok) {
					return 1
				}
			}
			await this.adminDeployer.deploy({
				dir: projectAdminDistDir,
				root: input.getOption('root') === true,
			})
			adminDeployed = true
		}

		const deployResult: DeployResult = {
			project: remoteProject.name,
			apiUrl: remoteProject.endpoint,
			adminUrl: remoteProject.adminEndpoint ?? null,
			migrationsDeployed,
			adminDeployed,
		}
		output.data(
			deployResult,
			{
				human: it =>
					[
						'',
						'Deployment successful',
						`API URL: ${escapeTerminalText(it.apiUrl)}`,
						`Admin URL: ${it.adminUrl === null ? 'none' : escapeTerminalText(it.adminUrl)}`,
					].join('\n'),
				quiet: it => it.apiUrl,
			},
		)

		return 0
	}
}
