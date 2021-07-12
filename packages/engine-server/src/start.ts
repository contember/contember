#!/usr/bin/env node

import { createContainer, readConfig } from './index'
import { Server } from 'net'
import loadPlugins from './loadPlugins'
import { ConfigProcessor } from '@contember/engine-plugins'
import { join } from 'path'
import os from 'os'
import cluster from 'cluster'
import { getClusterProcessType, initSentry, notifyWorkerStarted, timeout, waitForWorker } from './utils'

const createServerTerminator = (): Server[] => {
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
				await new Promise(resolve => server.close(() => resolve(null)))
			}
			process.exit(128 + code)
		})
	}
	return servers
}

;(async () => {
	const isDebug = process.env.NODE_ENV === 'development'

	if (cluster.isMaster) {
		const packageJsonFile = join(__dirname, '../../package.json')
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const version = require(packageJsonFile).version
		// eslint-disable-next-line no-console
		console.log(`Starting Contember ${version}`)
		// eslint-disable-next-line no-console
		console.log(`NODE_ENV is set to ${process.env.NODE_ENV}`)
		if (isDebug) {
			// eslint-disable-next-line no-console
			console.log('Starting Contember in debug mode')
			// eslint-disable-next-line no-console
			console.log('NEVER USE debug mode in production environment')
		}
	}

	const configFile = process.env['CONTEMBER_CONFIG_FILE']
	const projectsDir = process.env['CONTEMBER_PROJECTS_DIRECTORY']

	const plugins = await loadPlugins()
	const configProcessors = plugins
		.map(it => (it.getConfigProcessor ? it.getConfigProcessor() : null))
		.filter((it): it is ConfigProcessor => it !== null)
	const config = await readConfig(configFile ? [configFile] : [], configProcessors)

	if (process.argv[2] === 'validate') {
		process.exit(0)
	}
	initSentry(config.server.logging.sentry?.dsn)
	const workerConfig = config.server.workerCount || 1

	const workerCount = workerConfig === 'auto' ? os.cpus().length : Number(workerConfig)
	const isClusterMode = workerCount > 1

	const clusterMode = getClusterProcessType(isClusterMode)

	const container = createContainer(isDebug, config, projectsDir || null, plugins, clusterMode)

	if (cluster.isMaster) {
		const monitoringPort = config.server.monitoringPort
		const terminator = createServerTerminator()
		terminator.push(
			container.monitoringKoa.listen(monitoringPort, () => {
				// eslint-disable-next-line no-console
				console.log(`Monitoring running on http://localhost:${monitoringPort}`)
			}),
		)
		await container.initializer.initialize()
	}

	const port = config.server.port
	const printStarted = () => {
		// eslint-disable-next-line no-console
		console.log(`Contember API running on http://localhost:${port}`)
		const projectSlugs = Object.values(config.projects).map(it => it.slug)
		// eslint-disable-next-line no-console
		console.log(`Initialized projects: ${projectSlugs.join(', ')}`)
	}

	if (isClusterMode && cluster.isMaster) {
		// eslint-disable-next-line no-console
		console.log(`Master ${process.pid} is running`)
		for (let i = 0; i < workerCount; i++) {
			cluster.fork()
			await waitForWorker(15000)
		}
		printStarted()

		cluster.on('exit', async (worker, code, signal) => {
			// eslint-disable-next-line no-console
			console.log(`Worker ${worker.process.pid} died with signal ${signal}, restarting`)
			await timeout(2000)
			cluster.fork()
		})
	} else {
		if (isClusterMode) {
			// eslint-disable-next-line no-console
			console.log(`Starting worker ${process.pid}`)
		}
		const serverTerminator = createServerTerminator()

		serverTerminator.push(
			container.koa.listen(port, () => {
				if (!isClusterMode) {
					printStarted()
				} else {
					notifyWorkerStarted()
				}
			}),
		)
	}
})().catch(e => {
	// eslint-disable-next-line no-console
	console.log(e)
	process.exit(1)
})
