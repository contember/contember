#!/usr/bin/env node
import { Application, CommandFactoryList, CommandManager, getPackageVersion, Workspace } from '@contember/cli-common'
import {
	DeployCommand,
	MigrationAmendCommand,
	MigrationBlankCommand,
	MigrationDescribeCommand,
	MigrationDiffCommand,
	MigrationExecuteCommand,
	MigrationRebaseCommand,
	MigrationStatusCommand,
	ProjectGenerateDocumentation,
	ProjectPrintSchemaCommand,
	ProjectValidateCommand,
	VersionCommand,
	WorkspaceUpdateApiCommand,
} from './commands'
import { ExportCommand, ImportCommand, TransferCommand } from './commands/transfer'
import { checkVersions } from './utils/checkVersions';

(async () => {
	const workspace = await Workspace.get(process.cwd())

	const commands: CommandFactoryList = {
		['deploy']: () => new DeployCommand(workspace),
		['version']: () => new VersionCommand(),
		['data:export']: () => new ExportCommand(workspace),
		['data:import']: () => new ImportCommand(workspace),
		['data:transfer']: () => new TransferCommand(workspace),
		['migrations:diff']: () => new MigrationDiffCommand(workspace),
		['migrations:amend']: () => new MigrationAmendCommand(workspace),
		['migrations:blank']: () => new MigrationBlankCommand(workspace),
		['migrations:describe']: () => new MigrationDescribeCommand(workspace),
		['migrations:execute']: () => new MigrationExecuteCommand(workspace),
		['migrations:rebase']: () => new MigrationRebaseCommand(workspace),
		['migrations:status']: () => new MigrationStatusCommand(workspace),
		['workspace:update:api']: () => new WorkspaceUpdateApiCommand(workspace),
		['project:validate']: () => new ProjectValidateCommand(workspace),
		['project:print-schema']: () => new ProjectPrintSchemaCommand(workspace),
		['project:generate-doc']: () => new ProjectGenerateDocumentation(workspace),
	}

	const commandManager = new CommandManager(commands)

	const nodeVersion = process.version.match(/^v?(\d+)\..+$/)
	if (nodeVersion && Number(nodeVersion[1]) < 12) {
		throw `Node >= 12 is required`
	}
	const cliVersion = getPackageVersion()
	const app = new Application(
		commandManager,
		`Contember CLI version ${cliVersion}`,
		{
			beforeRun: async ({ name }) => {
				if (!process.env.CONTEMBER_SKIP_VERSION_CHECK && !['deploy', 'version', 'data:export', 'data:import', 'data:transfer'].includes(name)) {
					await checkVersions(workspace)
				}
			},
		},
	)
	await app.run(process.argv.slice(2))
})().catch(e => {
	console.log(e)
	process.exit(1)
})
