#!/usr/bin/env node

import { createContainer } from './index'
import loadPlugins from './loadPlugins'
import os from 'os'
import cluster from 'cluster'
import { getClusterProcessType, notifyWorkerStarted, timeout, waitForWorker } from './utils'
import { getServerVersion, isDebugMode, printStartInfo, resolveServerConfig } from '@contember/engine-server'
import { initSentry } from '@contember/engine-server'
import { serverConfigSchema } from './config/configSchema'
import { createServerTerminator } from '@contember/engine-server'
import { Server } from 'http';

(async () => {
	if (process.env.NODE_HEAPDUMP === 'true') {
		// eslint-disable-next-line no-console
		console.log('Initializing heapdump')
		await import('heapdump')
	}
	const isDebug = isDebugMode()
	const version = getServerVersion()
	printStartInfo({ version, isDebug })
	const plugins = await loadPlugins()
	const { serverConfig, projectConfigResolver, tenantConfigResolver } = await resolveServerConfig({ plugins, serverConfigSchema })

	if (process.argv[2] === 'validate') {
		process.exit(0)
	}
	initSentry(serverConfig.logging.sentry?.dsn)
	const workerConfig = serverConfig.workerCount || 1

	const workerCount = workerConfig === 'auto' ? os.cpus().length : Number(workerConfig)
	const isClusterMode = workerCount > 1

	const processType = getClusterProcessType(isClusterMode)

	const container = createContainer({
		debugMode: isDebug,
		serverConfig,
		projectConfigResolver,
		tenantConfigResolver,
		plugins,
		processType,
		version,
	})

	let initializedProjects: string[] = []
	const servers: Server[] = []
	createServerTerminator(servers)

	if (cluster.isMaster) {
		const monitoringPort = serverConfig.monitoringPort
		servers.push(
			container.monitoringKoa.listen(monitoringPort, () => {
				// eslint-disable-next-line no-console
				console.log(`Monitoring running on http://localhost:${monitoringPort}`)
			}),
		)
		if (!serverConfig.projectGroup) {
			initializedProjects = await container.initializer.initialize()
		}
	}

	const port = serverConfig.port
	const printStarted = () => {
		if (serverConfig.projectGroup) {
			// eslint-disable-next-line no-console
			console.log('Contember Cloud running')
		} else {
			// eslint-disable-next-line no-console
			console.log(`Contember API running on http://localhost:${port}`)
			// eslint-disable-next-line no-console
			console.log(initializedProjects.length ? `Initialized projects: ${initializedProjects.join(', ')}` : 'No project initialized')
		}
	}

	if (isClusterMode) {
		if (cluster.isMaster) {
			// eslint-disable-next-line no-console
			console.log(`Master ${process.pid} is running`)
			cluster.on('exit', async (worker, code, signal) => {
				// eslint-disable-next-line no-console
				console.log(`Worker ${worker.process.pid} died with signal ${signal}, restarting`)
				await timeout(2000)
				cluster.fork()
			})
			for (let i = 0; i < workerCount; i++) {
				cluster.fork()
				await waitForWorker(15000)
			}
			printStarted()
		} else {
			// eslint-disable-next-line no-console
			console.log(`Starting worker ${process.pid}`)
			servers.push(container.koa.listen(port, () => notifyWorkerStarted()))
		}
	} else {
		servers.push(container.koa.listen(port, () => printStarted()))
	}

})().catch(e => {
	// eslint-disable-next-line no-console
	console.log(e)
	process.exit(1)
})
