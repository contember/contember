#!/usr/bin/env node
import { register } from 'ts-node'
import { CommandManager } from './cli/CommandManager'
import {
	CreateApiKeyCommand,
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
	WorkspaceConfigureCommand,
	WorkspaceCreateCommand,
	WorkspaceUpdateApiCommand,
} from './commands'
import { Application } from './cli'
import { VersionCommand } from './commands/misc'
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
		['version']: () => new VersionCommand(),
		['migrations:diff']: diffCommandFactory,
		['migrations:amend']: () => new MigrationAmendCommand(),
		['migrations:describe']: migrationsDescribeFactory,
		['migrations:create']: () => new MigrationCreateCommand(),
		['migrations:execute']: () => new MigrationExecuteCommand(),
		['migrations:rebase']: () => new MigrationRebaseCommand(),
		['migrations:status']: () => new MigrationStatusCommand(),
		['workspace:create']: () => new WorkspaceCreateCommand(),
		['workspace:update:api']: () => new WorkspaceUpdateApiCommand(),
		['workspace:configure']: () => new WorkspaceConfigureCommand(),
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

	const version = process.version.match(/^v?(\d+)\..+$/)
	if (version && Number(version[1]) < 12) {
		throw `Node >= 12 is required`
	}
	const app = new Application(commandManager)
	await app.run(process.argv)
})().catch(e => {
	console.log(e)
	process.exit(1)
})
