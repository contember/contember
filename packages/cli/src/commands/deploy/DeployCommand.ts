import { Command, CommandConfiguration, Input } from '@contember/cli-common'
import prompts from 'prompts'
import { maskToken } from '../../lib/maskToken'
import { MigrationExecutionFacade } from '../../lib/migrations/MigrationExecutionFacade'
import { AdminDeployer } from '../../lib/admin/AdminDeployer'
import { FileSystem } from '../../lib/fs/FileSystem'
import { RemoteProject } from '../../lib/project/RemoteProject'
import { Workspace } from '../../lib/workspace/Workspace'
import { RemoteProjectProvider } from '../../lib/project/RemoteProjectProvider'
import { RemoteProjectResolver } from '../../lib/project/RemoteProjectResolver'

type Args = {
	dsn?: string
}

type Options = {
	admin?: string
	['no-admin']?: boolean
	['no-migrations']?: boolean
	root?: boolean
	yes?: boolean
}

export class DeployCommand extends Command<Args, Options> {
	constructor(
		private readonly adminDeployer: AdminDeployer,
		private readonly migrationExecutionFacade: MigrationExecutionFacade,
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
		configuration //
			.option('yes')
			.valueNone()
			.description('Do not ask for confirmation.')
	}

	protected async execute(input: Input<Args, Options>): Promise<void | number> {

		const dsn = input.getArgument('dsn')
		const adminEndpoint = input.getOption('admin')
		const remoteProject = this.remoteProjectResolver.resolve(dsn, adminEndpoint)
		if (!remoteProject) {
			throw `Project not defined. Please provide DSN or environment variables CONTEMBER_*`
		}
		this.remoteProjectProvider.setRemoteProject(remoteProject)

		const deployMigration = input.getOption('no-migrations') !== true
		const yes = input.getOption('yes') === true
		const projectAdminDistDir = this.workspace.adminDistDir

		const deployAdmin = input.getOption('no-admin') !== true && !!remoteProject.adminEndpoint && !!projectAdminDistDir


		console.log('')
		console.log('Contember project deployment configuration:')
		console.log(`Target project name: ${remoteProject.name}`)
		console.log(`API URL: ${remoteProject.endpoint}`)
		console.log(`Admin URL: ${remoteProject.adminEndpoint ?? 'none'}`)
		console.log(`Deploy token: ${maskToken(remoteProject.token)}`)
		console.log('')


		if (deployAdmin && !(await this.fs.pathExists(`${projectAdminDistDir}/index.html`))) {
			throw `Missing ${projectAdminDistDir}/index.html. Please build admin before deploying.`
		}

		if (deployMigration) {
			const result = await this.migrationExecutionFacade.execute({
				force: false,
				requireConfirmation: !yes,
				additionalMessage: deployAdmin ? 'Admin will be deployed.' : 'Admin will NOT be deployed.',
			})
			if (!result) {
				return
			}
		}

		if (deployAdmin) {
			if (!deployMigration && !yes) {
				if (!process.stdin.isTTY) {
					throw 'TTY not available. Pass --yes option to confirm execution.'
				}
				console.log('Admin will be deployed.')
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
			await this.adminDeployer.deploy({
				dir: projectAdminDistDir,
				root: input.getOption('root') === true,
			})
		}

		console.log('')
		console.log('Deployment successful')
		console.log(`API URL: ${remoteProject.endpoint}`)
		console.log(`Admin URL: ${remoteProject.adminEndpoint ?? 'none'}`)

		return 0
	}
}
