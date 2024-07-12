#!/usr/bin/env node
import { Application, CommandManager } from '@contember/cli-common'
import { WorkspaceCreateCommand } from './commands'
import { TemplateInstaller } from './lib/TemplateInstaller'
import { resourcesDir } from './lib/pathUtils'
import { PackageDownloader } from './lib/PackageDownloader'
import { FileSystem } from './lib/FileSystem'

(async () => {
	const commandManager = new CommandManager({
		['workspace']: () => new WorkspaceCreateCommand(new TemplateInstaller(
			resourcesDir,
			new PackageDownloader(new FileSystem()),
			new FileSystem(),
		)),
	})

	const nodeVersion = process.version.match(/^v?(\d+)\..+$/)
	if (nodeVersion && Number(nodeVersion[1]) < 18) {
		throw `Node >= 18 is required`
	}
	const app = new Application(commandManager, `Contember installer`)
	await app.runCommand('workspace', process.argv.slice(2))
})().catch(e => {
	// eslint-disable-next-line no-console
	console.log(e)
	process.exit(1)
})
