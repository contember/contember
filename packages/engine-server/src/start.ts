#!/usr/bin/env node

import {
	createContainer,
	createDefaultLogger, createSentryLoggerHandler,
	listenOnProcessTermination,
	serverConfigSchema,
	TerminationJob,
} from './index'
import loadPlugins from './loadPlugins'
import { getServerVersion, isDebugMode, printStartInfo, resolveServerConfig } from './utils/serverStartup'

const logger = createDefaultLogger()
process.on('warning', message => {
	logger.warn(message)
})
;(async () => {
	const isDebug = isDebugMode()
	if (process.env.NODE_HEAPDUMP === 'true') {
		logger.info('Initializing heapdump')
		await import('heapdump')
	}
	const terminationJobs: TerminationJob[] = []
	listenOnProcessTermination(terminationJobs, logger)

	const version = getServerVersion()
	printStartInfo({ version, isDebug }, logger)
	const plugins = await loadPlugins()
	const { serverConfig, projectConfigResolver, tenantConfigResolver } = await resolveServerConfig({ plugins, serverConfigSchema })

	const sentryTransport = createSentryLoggerHandler(serverConfig.logging.sentry?.dsn)
	if (sentryTransport !== null) {
		logger.addHandler(sentryTransport)
	}

	const container = createContainer({
		debugMode: isDebug,
		serverConfig,
		projectConfigResolver,
		tenantConfigResolver,
		plugins,
		version,
		logger,
	})

	const initializedProjects: string[] = await container.initializer.initialize()

	const httpServer = container.koa.listen(serverConfig.port, () => {
		logger.info(`Contember API running on http://localhost:${(serverConfig.port)}`)
		logger.info(initializedProjects.length ? `Initialized projects: ${initializedProjects.join(', ')}` : 'No project initialized')
	})
	terminationJobs.push(() => new Promise<any>(resolve => httpServer.close(resolve)))
})().catch(e => {
	logger.crit(e)
	process.exit(1)
})
