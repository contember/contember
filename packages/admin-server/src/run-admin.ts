#!/usr/bin/env node

import Server, { Configuration } from './Server.js'
import { Server as HttpServer } from 'net'
;(async () => {
	try {
		const server = new Server()
		const config: Configuration = {
			apiBaseUrl: String(process.env['CONTEMBER_API_SERVER']),
			loginToken: String(process.env['CONTEMBER_LOGIN_TOKEN']),
			port: Number(process.env['CONTEMBER_PORT']),
			configPlaceholder: String(process.env['CONTEMBER_CONFIG_PLACEHOLDER']),
			indexFile: String(process.env['CONTEMBER_INDEX_FILE']),
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
