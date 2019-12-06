import { createServer } from 'net'

export const isPortAvailable = async (port: number) => {
	const createPromise = () =>
		new Promise((resolve, reject) => {
			const server = createServer()
			server.unref()
			server.on('error', reject)
			server.listen({ port }, () => {
				server.close(() => {
					resolve(port)
				})
			})
		})
	try {
		await createPromise()
		return true
	} catch (e) {
		if (e.code !== 'EADDRINUSE') {
			throw e
		}
		return false
	}
}

export const getPorts = async (startPort: number, count: number) => {
	const ports = []
	for (let port = startPort; startPort <= 65535 && count > 0; port++, count--) {
		if (await isPortAvailable(port)) {
			ports.push(port)
		}
	}
	return ports
}
