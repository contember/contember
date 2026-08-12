#!/usr/bin/env node
import { Application, CommandManager, exitProcess, Output, readGlobalOptionsFromArgs, renderCliError } from '@contember/cli-common'
import { WorkspaceCreateCommand } from './commands/index.js'
import { FileSystem } from './lib/FileSystem.js'
import { TemplateInstaller } from './lib/TemplateInstaller.js'
import { resourcesDir } from './paths.js'

const output = new Output()
output.applyGlobalOptions(readGlobalOptionsFromArgs(process.argv.slice(2)))
;(async () => {
	const commandManager = new CommandManager({
		['workspace']: () =>
			new WorkspaceCreateCommand(
				new TemplateInstaller(
					resourcesDir,
					new FileSystem(),
					output,
				),
			),
	})

	const nodeVersion = process.version.match(/^v?(\d+)\..+$/)
	if (nodeVersion && Number(nodeVersion[1]) < 18) {
		throw `Node >= 18 is required`
	}
	const app = new Application(commandManager, `Contember installer`, output)
	await app.runCommand('workspace', process.argv.slice(2))
})().catch(error => exitProcess(renderCliError(error, output)))
