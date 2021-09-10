#!/usr/bin/env node
import { register } from 'ts-node'
import { Application, CommandManager, getPackageVersion } from '@contember/cli-common'
import {
	CreateApiKeyCommand,
	DeployCommand,
	InviteCommand,
	MigrationAmendCommand,
	MigrationCreateCommand,
	MigrationDescribeCommand,
	MigrationDiffCommand,
	MigrationExecuteCommand,
	MigrationRebaseCommand,
	MigrationStatusCommand,
	ProjectCreateCommand,
	ProjectPrintSchemaCommand,
	ProjectValidateCommand,
	ResetPasswordCommand,
	SignInCommand,
	VersionCommand,
	WorkspaceUpdateApiCommand,
} from './commands'
;(async () => {
	register({
		compilerOptions: {
			experimentalDecorators: true,
			module: 'commonjs',
		},
	})
	const diffCommandFactory = () => new MigrationDiffCommand()
	const migrationsDescribeFactory = () => new MigrationDescribeCommand()
	const commandManager = new CommandManager({
		['deploy']: () => new DeployCommand(),
		['version']: () => new VersionCommand(),
		['migrations:diff']: diffCommandFactory,
		['migrations:amend']: () => new MigrationAmendCommand(),
		['migrations:describe']: migrationsDescribeFactory,
		['migrations:create']: () => new MigrationCreateCommand(),
		['migrations:execute']: () => new MigrationExecuteCommand(),
		['migrations:rebase']: () => new MigrationRebaseCommand(),
		['migrations:status']: () => new MigrationStatusCommand(),
		['workspace:update:api']: () => new WorkspaceUpdateApiCommand(),
		['project:create']: () => new ProjectCreateCommand(),
		['project:validate']: () => new ProjectValidateCommand(),
		['project:print-schema']: () => new ProjectPrintSchemaCommand(),
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
	const cliVersion = getPackageVersion()
	const app = new Application(commandManager, `Contember CLI version ${cliVersion}`)
	await app.run(process.argv.slice(2))
})().catch(e => {
	console.log(e)
	process.exit(1)
})
