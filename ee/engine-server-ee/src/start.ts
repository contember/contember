#!/usr/bin/env node

import { createContainer } from './index'
import loadPlugins from './loadPlugins'
import os from 'os'
import cluster from 'cluster'
import { getClusterProcessType, notifyWorkerStarted, timeout, WorkerManager } from './utils'
import {
	createDefaultLogger, createSentryLoggerHandler,
	getServerVersion,
	isDebugMode,
	listenOnProcessTermination,
	printStartInfo,
	resolveServerConfig,
	TerminationJob,
} from '@contember/engine-http'
import { serverConfigSchema } from './config/configSchema'

const logger = createDefaultLogger()

;(async () => {
	const isDebug = isDebugMode()
	if (process.env.NODE_HEAPDUMP === 'true') {
		logger.info('Initializing heapdump')
		await import('heapdump')
	}
	const version = getServerVersion()
	printStartInfo({ version, isDebug }, logger)
	const plugins = await loadPlugins()
	const { serverConfig, projectConfigResolver, tenantConfigResolver } = await resolveServerConfig({ plugins, serverConfigSchema })

	if (process.argv[2] === 'validate') {
		process.exit(0)
	}

	const sentryhandler = createSentryLoggerHandler(serverConfig.logging.sentry?.dsn)
	if (sentryhandler !== null) {
		logger.addHandler(sentryhandler)
	}

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
		logger,
	})

	let initializedProjects: string[] = []
	const terminationJobs: TerminationJob[] = []
	listenOnProcessTermination(terminationJobs, logger)

	if (cluster.isMaster) {
		const monitoringPort = serverConfig.monitoringPort
		const monitoringServer = container.monitoringKoa.listen(monitoringPort, () => {
			logger.info(`Monitoring running on http://localhost:${monitoringPort}`)
		})
		terminationJobs.push(async () => {
			await new Promise<any>(resolve => monitoringServer.close(resolve))
			logger.info('Monitoring server terminated')
		})
		if (!serverConfig.projectGroup) {
			initializedProjects = await container.initializer.initialize()
		}
	}

	const port = serverConfig.port
	const printStarted = () => {
		if (serverConfig.projectGroup) {
			logger.info('Contember Cloud running')
		} else {
			logger.info(`Contember API running on http://localhost:${port}`)
			logger.info(initializedProjects.length ? `Initialized projects: ${initializedProjects.join(', ')}` : 'No project initialized')
		}
	}

	if (isClusterMode) {
		if (cluster.isMaster) {
			logger.info(`Master ${process.pid} is running`)
			const workerManager = new WorkerManager(workerCount)
			terminationJobs.push(async ({ signal }) => {
				await workerManager.terminate(signal)
				logger.info('Workers terminated')
			})
			await workerManager.start()
			printStarted()
		} else {
			logger.info(`Starting worker ${process.pid}`)

			// this line somehow ensures, that worker waits for termination of all jobs
			process.on('disconnect', () => timeout(0))

			const httpServer = container.koa.listen(port, () => notifyWorkerStarted())
			terminationJobs.push(async () => {
				await new Promise<any>(resolve => httpServer.close(resolve))
				logger.info('API server terminated')
			})
		}
	} else {
		const httpServer = container.koa.listen(port, () => printStarted())
		terminationJobs.push(async () => {
			await new Promise<any>(resolve => httpServer.close(resolve))
			logger.info('API server terminated')
		})
	}

})().catch(e => {
	logger.crit(e)
	process.exit(1)
})
