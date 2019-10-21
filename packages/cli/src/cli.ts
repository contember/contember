#!/usr/bin/env node
import { register } from 'ts-node'
import { CommandManager } from './cli/CommandManager'
import { DiffCommand } from './commands/DiffCommand'
import Application from './cli/Application'
import DryRunCommand from './commands/DryRunCommand'
;
import SetupCommand from './commands/SetupCommand'

(async () => {
	register({
		compilerOptions: {
			experimentalDecorators: true,
		},
	})
	const commandManager = new CommandManager({
		['diff']: () => new DiffCommand(),
		['dry-run']: () => new DryRunCommand(),
		['setup']: () => new SetupCommand(),
	})
	const app = new Application(commandManager)
	app.run(process.argv)
})().catch(e => {
	console.log(e)
	process.exit(1)
})
