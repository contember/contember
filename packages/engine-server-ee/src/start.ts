#!/usr/bin/env node

import { createContainer } from './index'
import loadPlugins from './loadPlugins'
import os from 'node:os'
import cluster from 'node:cluster'
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
	const isClusterMode = serverConfig.workerCount !== undefined

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
		}
		if (initializedProjects.length) {
			logger.info(`Initialized projects: ${initializedProjects.join(', ')}`)
		}
	}

	const startApplication = async () => {
		const httpServerPromise = container.application.listen()
		terminationJobs.push(async () => {
			await (await httpServerPromise).close()
			logger.info('API server terminated')
		})
		await httpServerPromise
	}

	const startWorker = async (workerName: string) => {
		const worker = container.applicationWorkers.getWorker(workerName)
		const runningWorker = worker.run({
			logger,
			onError: e => {
				logger.crit(e)
				process.exit(1)
			},
		})
		terminationJobs.push(async () => {
			(await runningWorker).end()
		})
		await runningWorker
		logger.info(`Contember Worker ${workerName} started.`)

	}

	const applicationWorker = serverConfig.applicationWorker
	if (applicationWorker && applicationWorker !== 'all') {
		await startWorker(applicationWorker)
		if (isClusterMode) {
			notifyWorkerStarted()
		}
	} else if (isClusterMode) {
		if (cluster.isMaster) {
			logger.info(`Master ${process.pid} is running`)
			const workerManager = new WorkerManager()
			terminationJobs.push(async ({ signal }) => {
				await workerManager.terminate(signal)
				logger.info('Workers terminated')
			})

			await workerManager.start({ workerCount })

			if (applicationWorker === 'all') {
				for (const workerName of container.applicationWorkers.getWorkerNames()) {
					await workerManager.start({
						workerCount, env: {
							CONTEMBER_APPLICATION_WORKER: workerName,
						},
					})
				}
			}
			printStarted()
		} else {
			logger.info(`Starting worker ${process.pid}`)

			// this line somehow ensures, that worker waits for termination of all jobs
			process.on('disconnect', () => timeout(0))

			await startApplication()
			notifyWorkerStarted()
		}
	} else {
		await startApplication()
		if (applicationWorker === 'all') {
			for (const workerName of container.applicationWorkers.getWorkerNames()) {
				await startWorker(workerName)
			}
		}
		printStarted()
	}

})().catch(e => {
	logger.crit(e)
	process.exit(1)
})
