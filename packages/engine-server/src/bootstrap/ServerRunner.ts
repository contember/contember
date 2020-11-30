import { Config } from '../config/config'
import { Server } from 'http'
import { Koa } from '@contember/engine-http'

export class ServerRunner {
	constructor(
		private readonly contemberKoa: Koa,
		private readonly monitoringKoa: Koa,
		private readonly config: Config,
	) {}

	public async run(): Promise<Server[]> {
		const port = this.config.server.port
		const contemberServer = this.contemberKoa.listen(port, () => {
			// eslint-disable-next-line no-console
			console.log(`Contember API running on http://localhost:${port}`)
			const projectSlugs = Object.values(this.config.projects).map(it => it.slug)
			// eslint-disable-next-line no-console
			console.log(`Initialized projects: ${projectSlugs.join(', ')}`)
		})

		const monitoringPort = this.config.server.monitoringPort
		const monitoringServer = this.monitoringKoa.listen(monitoringPort, () => {
			// eslint-disable-next-line no-console
			console.log(`Monitoring running on http://localhost:${monitoringPort}`)
		})

		return [contemberServer, monitoringServer]
	}
}
