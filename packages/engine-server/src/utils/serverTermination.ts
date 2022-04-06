import { Server } from 'net'

export const createServerTerminator = (): Server[] => {
	const signals = {
		SIGHUP: 1,
		SIGINT: 2,
		SIGTERM: 15,
	}
	const servers: Server[] = [] // mutable
	for (const [signal, code] of Object.entries(signals)) {
		process.on(signal, async () => {
			// eslint-disable-next-line no-console
			console.log(`process received a ${signal} signal`)
			for (const server of servers) {
				await new Promise(resolve => server.close(() => resolve(null)))
			}
			process.exit(128 + code)
		})
	}
	return servers
}
