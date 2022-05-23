#!/usr/bin/env node

import { createContainer } from './index'
import loadPlugins from './loadPlugins'
import os from 'os'
import cluster from 'cluster'
import { getClusterProcessType, notifyWorkerStarted, timeout, WorkerManager } from './utils'
import {
	getServerVersion,
	initSentry,
	isDebugMode,
	listenOnProcessTermination,
	printStartInfo,
	resolveServerConfig,
	TerminationJob,
} from '@contember/engine-server'
import { serverConfigSchema } from './config/configSchema'

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
	const terminationJobs: TerminationJob[] = []
	listenOnProcessTermination(terminationJobs)

	if (cluster.isMaster) {
		const monitoringPort = serverConfig.monitoringPort
		const monitoringServer = container.monitoringKoa.listen(monitoringPort, () => {
			// eslint-disable-next-line no-console
			console.log(`Monitoring running on http://localhost:${monitoringPort}`)
		})
		terminationJobs.push(async () => {
			await new Promise<any>(resolve => monitoringServer.close(resolve))
			// eslint-disable-next-line no-console
			console.log('Monitoring server terminated')
		})
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
			const workerManager = new WorkerManager(workerCount)
			terminationJobs.push(async ({ signal }) => {
				await workerManager.terminate(signal)
				// eslint-disable-next-line no-console
				console.log('Workers terminated')
			})
			await workerManager.start()
			printStarted()
		} else {
			// eslint-disable-next-line no-console
			console.log(`Starting worker ${process.pid}`)

			// this line somehow ensures, that worker waits for termination of all jobs
			process.on('disconnect', () => timeout(0))

			const httpServer = container.koa.listen(port, () => notifyWorkerStarted())
			terminationJobs.push(async () => {
				await new Promise<any>(resolve => httpServer.close(resolve))
				// eslint-disable-next-line no-console
				console.log('API server terminated')
			})
		}
	} else {
		const httpServer = container.koa.listen(port, () => printStarted())
		terminationJobs.push(async () => {
			await new Promise<any>(resolve => httpServer.close(resolve))
			// eslint-disable-next-line no-console
			console.log('API server terminated')
		})
	}

})().catch(e => {
	// eslint-disable-next-line no-console
	console.log(e)
	process.exit(1)
})
