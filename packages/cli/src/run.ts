#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { exitProcess, Output, readGlobalOptionsFromArgs, renderCliError } from '@contember/cli-common'
import { packageRoot } from './consts.js'
import { createContainer } from './dic.js'
import { readCliEnv } from './lib/env.js'
import { WorkspaceResolver } from './lib/workspace/WorkspaceResolver.js'
import { YamlHandler } from './lib/fs/YamlHandler.js'
import { FileSystem } from './lib/fs/FileSystem.js'

const output = new Output()
output.applyGlobalOptions(readGlobalOptionsFromArgs(process.argv.slice(2)))
;(async () => {
	const packageJson: unknown = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
	if (
		typeof packageJson !== 'object'
		|| packageJson === null
		|| !('version' in packageJson)
		|| typeof packageJson.version !== 'string'
		|| packageJson.version.length === 0
	) {
		throw new Error('CLI package version is missing')
	}
	const version = packageJson.version
	const nodeVersion = process.version.match(/^v?(\d+)\..+$/)
	if (nodeVersion && Number(nodeVersion[1]) < 18) {
		throw `Node >= 18 is required`
	}
	const env = readCliEnv()
	const dir = env.dir ? resolve(env.dir) : process.cwd()
	const workspaceResolver = new WorkspaceResolver(new YamlHandler(new FileSystem()))
	const workspace = await workspaceResolver.resolve(dir)
	const dic = createContainer({
		version,
		workspace,
		env: env,
		runtime: process.title === 'bun' ? 'bun' : 'node',
		output,
	})

	await dic.application.run(process.argv.slice(2))
})().catch(e => {
	// bootstrap failures only — everything thrown by a command is rendered by Application
	exitProcess(renderCliError(e, output))
})
