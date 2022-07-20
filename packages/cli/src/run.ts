#!/usr/bin/env node
import { Application, CommandManager, getPackageVersion, Workspace } from '@contember/cli-common'
import {
	CreateApiKeyCommand,
	DeployCommand,
	InviteCommand,
	MigrationAmendCommand,
	MigrationDescribeCommand,
	MigrationDiffCommand,
	MigrationExecuteCommand,
	MigrationRebaseCommand,
	MigrationStatusCommand,
	ProjectCreateCommand,
	ProjectGenerateDocumentation,
	ProjectPrintSchemaCommand,
	ProjectValidateCommand,
	ResetPasswordCommand,
	SignInCommand,
	VersionCommand,
	WorkspaceUpdateApiCommand,
} from './commands';

(async () => {
	const workspace = await Workspace.get(process.cwd())
	const commandManager = new CommandManager({
		['deploy']: () => new DeployCommand(workspace),
		['version']: () => new VersionCommand(),
		['migrations:diff']: () => new MigrationDiffCommand(workspace),
		['migrations:amend']: () => new MigrationAmendCommand(workspace),
		['migrations:describe']: () => new MigrationDescribeCommand(workspace),
		['migrations:execute']: () => new MigrationExecuteCommand(workspace),
		['migrations:rebase']: () => new MigrationRebaseCommand(workspace),
		['migrations:status']: () => new MigrationStatusCommand(workspace),
		['workspace:update:api']: () => new WorkspaceUpdateApiCommand(workspace),
		['project:create']: () => new ProjectCreateCommand(workspace),
		['project:validate']: () => new ProjectValidateCommand(workspace),
		['project:print-schema']: () => new ProjectPrintSchemaCommand(workspace),
		['project:generate-doc']: () => new ProjectGenerateDocumentation(workspace),
		['tenant:sign-in']: () => new SignInCommand(workspace),
		['tenant:create-api-key']: () => new CreateApiKeyCommand(workspace),
		['tenant:invite']: () => new InviteCommand(workspace),
		['tenant:reset-password']: () => new ResetPasswordCommand(workspace),
	})

	const nodeVersion = process.version.match(/^v?(\d+)\..+$/)
	if (nodeVersion && Number(nodeVersion[1]) < 12) {
		throw `Node >= 12 is required`
	}
	const cliVersion = getPackageVersion()
	const app = new Application(commandManager, `Contember CLI version ${cliVersion}`)
	await app.run(process.argv.slice(2))
})().catch(e => {
	console.log(e)
	process.exit(1)
})
