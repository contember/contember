#!/usr/bin/env node

import { createContainer, readConfig } from '@contember/engine-server'
import * as path from 'path'
;(async () => {
	const configFile = path.join(__dirname, '../../src/config/config.yaml')
	const projectsDirectory = path.join(__dirname, '../../src/projects/')
	const config = await readConfig([configFile])
	const container = await createContainer(false, config, projectsDirectory, [])
	await container.initializer.initialize()
	const server = await container.koa.listen(config.server.port)

	const signals = [
		['SIGHUP', 1],
		['SIGINT', 2],
		['SIGTERM', 15],
	] as const
	for (const [signal, code] of signals) {
		process.on(signal, async () => {
			await new Promise(resolve => server.close(() => resolve(null)))
			process.exit(128 + code)
		})
	}
})().catch(e => {
	console.log(e)
	process.exit(1)
})
