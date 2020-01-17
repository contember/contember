#!/usr/bin/env node
import { register } from 'ts-node'
import { CommandManager } from './cli/CommandManager'
import {
	DiffCommand,
	DryRunCommand,
	InstanceCreateCommand,
	InstanceInfoCommand,
	InstanceLogsCommand,
	InstanceReloadAdminCommand,
	InstanceReloadApiCommand,
	InstanceStartCommand,
	InstanceStopCommand,
	InstanceValidateConfigCommand,
	ProjectCreateCommand,
	ProjectRegisterCommand,
	SetupCommand,
	WorkspaceCreateCommand,
} from './commands'
import { Application } from './cli'
;(async () => {
	register({
		compilerOptions: {
			experimentalDecorators: true,
		},
	})
	const diffCommandFactory = () => new DiffCommand()
	const commandManager = new CommandManager({
		['migrations:diff']: diffCommandFactory,
		['migrations:dry-run']: () => new DryRunCommand(),
		['workspace:create']: () => new WorkspaceCreateCommand(),
		['project:create']: () => new ProjectCreateCommand(),
		['project:register']: () => new ProjectRegisterCommand(),
		['instance:create']: () => new InstanceCreateCommand(),
		['instance:info']: () => new InstanceInfoCommand(),
		['instance:up']: () => new InstanceStartCommand(),
		['instance:down']: () => new InstanceStopCommand(),
		['instance:logs']: () => new InstanceLogsCommand(),
		['instance:validate-config']: () => new InstanceValidateConfigCommand(),
		['instance:reload:api']: () => new InstanceReloadApiCommand(),
		['instance:reload:admin']: () => new InstanceReloadAdminCommand(),
		['tenant:setup']: () => new SetupCommand(),
		['diff']: diffCommandFactory,
	})
	const app = new Application(commandManager)
	await app.run(process.argv)
})().catch(e => {
	console.log(e)
	process.exit(1)
})
