#!/usr/bin/env node
import { join, resolve } from 'node:path'
import { packageRoot } from './consts'
import { createContainer } from './dic'
import { readCliEnv } from './lib/env';

(async () => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const version = require(join(packageRoot, 'package.json')).version
	const nodeVersion = process.version.match(/^v?(\d+)\..+$/)
	if (nodeVersion && Number(nodeVersion[1]) < 18) {
		throw `Node >= 18 is required`
	}
	const env = readCliEnv()
	const dir = env.dir ? resolve(env.dir) : process.cwd()
	const dic = createContainer({
		version,
		dir,
		env: env,
		runtime: process.title === 'bun' ? 'bun' : 'node',
	})


	await dic.application.run(process.argv.slice(2))
})().catch(e => {
	console.log(e)
	process.exit(1)
})
