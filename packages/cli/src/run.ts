#!/usr/bin/env node
import { join, resolve } from 'node:path'
import { packageRoot } from './consts.js'
import { createContainer } from './dic.js'
import { readCliEnv } from './lib/env.js'
import { WorkspaceResolver } from './lib/workspace/WorkspaceResolver.js'
import { YamlHandler } from './lib/fs/YamlHandler.js'
import { FileSystem } from './lib/fs/FileSystem.js'
;(async () => {
	const version = require(join(packageRoot, 'package.json')).version
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
	})

	await dic.application.run(process.argv.slice(2))
})().catch(e => {
	console.log(e)
	process.exit(1)
})
