#!/usr/bin/env node

import { createContainer, ProcessType, readConfig } from '@contember/engine-server'
;(async () => {
	const { serverConfig, projectConfigResolver, tenantConfigResolver } = await readConfig([])
	const container = await createContainer({
		debugMode: false,
		serverConfig,
		projectConfigResolver,
		tenantConfigResolver,
		plugins: [],
		processType: ProcessType.singleNode,
	})
	await container.initializer.initialize()
	const server = await container.koa.listen(serverConfig.port)

	const signals = [
		['SIGHUP', 1],
		['SIGINT', 2],
		['SIGTERM', 15],
	] as const
	for (const [signal, code] of signals) {
		process.on(signal, async () => {
			await new Promise(resolve => server.close(() => resolve(null)))
			process.exit(128 + code)
		})
	}
})().catch(e => {
	console.log(e)
	process.exit(1)
})
