#!/usr/bin/env node

import { readConfig, run } from './index'
import { Server } from 'net'
import loadPlugins from './loadPlugins'
import { ConfigProcessor } from '@contember/engine-plugins'
import { join } from 'path'
;(async () => {
	const packageJsonFile = join(__dirname, '../../package.json')
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const version = require(packageJsonFile).version
	// eslint-disable-next-line no-console
	console.log(`Starting Contember ${version}`)

	const configFile = process.env['CONTEMBER_CONFIG_FILE']
	if (!configFile) {
		throw new Error('env variable CONTEMBER_CONFIG_FILE is not set')
	}
	const projectsDir = process.env['CONTEMBER_PROJECTS_DIRECTORY']
	if (!projectsDir) {
		throw new Error('env variable CONTEMBER_PROJECTS_DIRECTORY is not set')
	}
	const signals = [
		['SIGHUP', 1],
		['SIGINT', 2],
		['SIGTERM', 15],
	] as const

	let servers: Server[] = []
	for (const [signal, code] of signals) {
		process.on(signal, async () => {
			// eslint-disable-next-line no-console
			console.log(`process received a ${signal} signal`)
			for (const server of servers) {
				await new Promise(resolve => server.close(() => resolve()))
			}
			process.exit(128 + code)
		})
	}
	const debug = process.env.NODE_ENV === 'development'
	// eslint-disable-next-line no-console
	console.log(`NODE_ENV is set to ${process.env.NODE_ENV}`)
	if (debug) {
		// eslint-disable-next-line no-console
		console.log('Starting Contember in debug mode')
		// eslint-disable-next-line no-console
		console.log('NEVER USE debug mode in production environment')
	}
	const plugins = await loadPlugins()
	const configProcessors = plugins
		.map(it => (it.getConfigProcessor ? it.getConfigProcessor() : null))
		.filter((it): it is ConfigProcessor => it !== null)
	const config = await readConfig([configFile], configProcessors)

	if (process.argv[2] === 'validate') {
		process.exit(0)
	}
	servers = await run(debug, config, projectsDir, plugins)
})().catch(e => {
	// eslint-disable-next-line no-console
	console.log(e)
	process.exit(1)
})
