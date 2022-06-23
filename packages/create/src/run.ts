#!/usr/bin/env node
import { CommandManager, Application } from '@contember/cli-common'
import { WorkspaceCreateCommand } from './commands/index.js'
;(async () => {
	const commandManager = new CommandManager({
		['workspace']: () => new WorkspaceCreateCommand(),
	})

	const nodeVersion = process.version.match(/^v?(\d+)\..+$/)
	if (nodeVersion && Number(nodeVersion[1]) < 12) {
		throw `Node >= 12 is required`
	}
	const app = new Application(commandManager, `Contember installer`)
	await app.runCommand('workspace', process.argv.slice(2))
})().catch(e => {
	// eslint-disable-next-line no-console
	console.log(e)
	process.exit(1)
})
