#!/usr/bin/env node

import { createContainer, listenOnProcessTermination, serverConfigSchema, TerminationJob } from './index'
import loadPlugins from './loadPlugins'
import { initSentry } from './utils'


import { getServerVersion, isDebugMode, printStartInfo, resolveServerConfig } from './utils/serverStartup'

(async () => {
	if (process.env.NODE_HEAPDUMP === 'true') {
		// eslint-disable-next-line no-console
		console.log('Initializing heapdump')
		await import('heapdump')
	}
	const terminationJobs: TerminationJob[] = []
	listenOnProcessTermination(terminationJobs)

	const isDebug = isDebugMode()
	const version = getServerVersion()
	printStartInfo({ version, isDebug })
	const plugins = await loadPlugins()
	const { serverConfig, projectConfigResolver, tenantConfigResolver } = await resolveServerConfig({ plugins, serverConfigSchema })

	initSentry(serverConfig.logging.sentry?.dsn)

	const container = createContainer({
		debugMode: isDebug,
		serverConfig,
		projectConfigResolver,
		tenantConfigResolver,
		plugins,
		version,
	})

	const initializedProjects: string[] = await container.initializer.initialize()

	const httpServer = container.koa.listen(serverConfig.port, () => {
		// eslint-disable-next-line no-console
		console.log(`Contember API running on http://localhost:${(serverConfig.port)}`)
		// eslint-disable-next-line no-console
		console.log(initializedProjects.length ? `Initialized projects: ${initializedProjects.join(', ')}` : 'No project initialized')
	})
	terminationJobs.push(() => new Promise<any>(resolve => httpServer.close(resolve)))
})().catch(e => {
	// eslint-disable-next-line no-console
	console.log(e)
	process.exit(1)
})
