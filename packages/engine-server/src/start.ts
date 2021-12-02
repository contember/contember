#!/usr/bin/env node

import { createContainer, readConfig } from './index'
import { Server } from 'net'
import loadPlugins from './loadPlugins'
import { ConfigProcessor } from '@contember/engine-plugins'
import { join } from 'path'
import os from 'os'
import cluster from 'cluster'
import { getClusterProcessType, initSentry, notifyWorkerStarted, timeout, waitForWorker } from './utils'
import { ConfigSource } from './config/config'

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
	const packageJsonFile = process.env.CONTEMBER_PACKAGE_JSON || join(__dirname, '../../package.json')
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const version = require(packageJsonFile).version

	if (cluster.isMaster) {
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

	const plugins = await loadPlugins()
	const configProcessors = plugins
		.map(it => (it.getConfigProcessor ? it.getConfigProcessor() : null))
		.filter((it): it is ConfigProcessor => it !== null)

	const configSources: ConfigSource[] = []
	for (const configType of ['file', 'yaml', 'json'] as const) {
		const envValue = process.env['CONTEMBER_CONFIG_' + configType.toUpperCase()]
		if (envValue) {
			configSources.push({ type: configType, data: envValue })
		}
	}

	const { config, projectConfigResolver } = await readConfig(configSources, configProcessors)

	if (process.argv[2] === 'validate') {
		process.exit(0)
	}
	'sentry' in config.server.logging && initSentry(config.server.logging.sentry?.dsn)
	const workerConfig = config.server.workerCount || 1

	const workerCount = workerConfig === 'auto' ? os.cpus().length : Number(workerConfig)
	const isClusterMode = workerCount > 1

	const processType = getClusterProcessType(isClusterMode)

	const container = createContainer({
		debugMode: isDebug,
		config,
		projectConfigResolver,
		plugins,
		processType,
		version,
	})

	let initializedProjects: string[] = []
	if (cluster.isMaster) {
		const monitoringPort = config.server.monitoringPort
		const terminator = createServerTerminator()
		terminator.push(
			container.monitoringKoa.listen(monitoringPort, () => {
				// eslint-disable-next-line no-console
				console.log(`Monitoring running on http://localhost:${monitoringPort}`)
			}),
		)
		if (!config.server.projectGroup) {
			initializedProjects = await container.initializer.initialize()
		}
	}

	const port = config.server.port
	const printStarted = () => {
		if (config.server.projectGroup) {
			// eslint-disable-next-line no-console
			console.log('Contember Cloud running')
		} else {
			// eslint-disable-next-line no-console
			console.log(`Contember API running on http://localhost:${port}`)
			// eslint-disable-next-line no-console
			console.log(initializedProjects.length ? `Initialized projects: ${initializedProjects.join(', ')}` : 'No project initialized')
		}
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
