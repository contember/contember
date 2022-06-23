#!/usr/bin/env node
import { Application, CommandManager, getPackageVersion } from '@contember/cli-common'
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
	const diffCommandFactory = () => new MigrationDiffCommand()
	const migrationsDescribeFactory = () => new MigrationDescribeCommand()
	const commandManager = new CommandManager({
		['deploy']: () => new DeployCommand(),
		['version']: () => new VersionCommand(),
		['migrations:diff']: diffCommandFactory,
		['migrations:amend']: () => new MigrationAmendCommand(),
		['migrations:describe']: migrationsDescribeFactory,
		['migrations:execute']: () => new MigrationExecuteCommand(),
		['migrations:rebase']: () => new MigrationRebaseCommand(),
		['migrations:status']: () => new MigrationStatusCommand(),
		['workspace:update:api']: () => new WorkspaceUpdateApiCommand(),
		['project:create']: () => new ProjectCreateCommand(),
		['project:validate']: () => new ProjectValidateCommand(),
		['project:print-schema']: () => new ProjectPrintSchemaCommand(),
		['project:generate-doc']: () => new ProjectGenerateDocumentation(),
		['tenant:sign-in']: () => new SignInCommand(),
		['tenant:create-api-key']: () => new CreateApiKeyCommand(),
		['tenant:invite']: () => new InviteCommand(),
		['tenant:reset-password']: () => new ResetPasswordCommand(),

		// deprecated
		['migrations:dry-run']: migrationsDescribeFactory,
		['diff']: diffCommandFactory,
	})

	const nodeVersion = process.version.match(/^v?(\d+)\..+$/)
	if (nodeVersion && Number(nodeVersion[1]) < 12) {
		throw `Node >= 12 is required`
	}
	const cliVersion = await getPackageVersion()
	const app = new Application(commandManager, `Contember CLI version ${cliVersion}`)
	await app.run(process.argv.slice(2))
})().catch(e => {
	console.log(e)
	process.exit(1)
})
