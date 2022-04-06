#!/usr/bin/env node

import { createContainer, serverConfigSchema } from './index'
import loadPlugins from './loadPlugins'
import { initSentry } from './utils'


import { createServerTerminator } from './utils/serverTermination'
import { getServerVersion, isDebugMode, printStartInfo, resolveServerConfig } from './utils/serverStartup'
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
	const servers: Server[] = []
	createServerTerminator(servers)

	servers.push(
		container.koa.listen(serverConfig.port, () => {
			// eslint-disable-next-line no-console
			console.log(`Contember API running on http://localhost:${(serverConfig.port)}`)
			// eslint-disable-next-line no-console
			console.log(initializedProjects.length ? `Initialized projects: ${initializedProjects.join(', ')}` : 'No project initialized')
		}),
	)
})().catch(e => {
	// eslint-disable-next-line no-console
	console.log(e)
	process.exit(1)
})
