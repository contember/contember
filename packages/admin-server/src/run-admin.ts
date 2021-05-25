#!/usr/bin/env node

import type { Server as HttpServer } from 'net'
import Server, { Configuration } from './Server.js'
;(async () => {
	try {
		const server = new Server()

		const envPrefixName = 'CONTEMBER_ADMIN_ENV_PREFIX'
		const envPrefix = process.env[envPrefixName] ?? 'CONTEMBER_ADMIN_'
		const envVariables = new Map<string, string>()

		for (const envVariableName in process.env) {
			if (envVariableName.startsWith(envPrefix) && envVariableName !== envPrefixName) {
				envVariables.set(envVariableName.substring(envPrefix.length), process.env[envVariableName]!)
			}
		}

		const config: Configuration = {
			apiBaseUrl: String(process.env['CONTEMBER_API_SERVER']),
			loginToken: String(process.env['CONTEMBER_LOGIN_TOKEN']),
			port: Number(process.env['CONTEMBER_PORT']),
			configPlaceholder: String(process.env['CONTEMBER_CONFIG_PLACEHOLDER']),
			indexFile: String(process.env['CONTEMBER_INDEX_FILE']),
			envVariables: Object.fromEntries(envVariables),
		}
		const signals = [
			['SIGHUP', 1],
			['SIGINT', 2],
			['SIGTERM', 15],
		] as const
		let httpServer: HttpServer
		for (const [signal, code] of signals) {
			process.on(signal, () => {
				console.log(`process received a ${signal} signal`)
				if (!httpServer) {
					process.exit(128 + code)
				} else {
					httpServer.close(() => {
						console.log(`server stopped by ${signal} with value ${code}`)
						process.exit(128 + code)
					})
				}
			})
		}
		httpServer = await server.run(config)
	} catch (e) {
		console.error(e)
		process.exit(1)
	}
})().catch(e => {
	console.error(e)
	process.exit(1)
})
