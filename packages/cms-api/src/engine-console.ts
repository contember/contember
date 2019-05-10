#!/usr/bin/env node

import { CommandManager } from './core/cli/CommandManager'
import EngineMigrationsCreateCommand from './cli/EngineMigrationsCreateCommand'
import Application from './core/cli/Application'

(async () => {
	const commandManager = new CommandManager({
		['engine:migrations:create']: () => new EngineMigrationsCreateCommand(),
	})
	const application = new Application(commandManager)

	await application.run(process.argv)
})().catch(e => {
	console.error(e)
	process.exit(1)
})

