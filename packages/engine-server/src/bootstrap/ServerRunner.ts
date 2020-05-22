import { Config } from '../config/config'
import { Server } from 'http'
import { success } from '../core/console/messages'
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
			console.log(success(`Tenant API running on http://localhost:${port}/tenant`))
			Object.values(this.config.projects).forEach(project => {
				const url = `http://localhost:${port}/system/${project.slug}`
				// eslint-disable-next-line no-console
				console.log(success(`System API for project ${project.slug} running on ${url}`))
				project.stages.forEach(stage => {
					const url = `http://localhost:${port}/content/${project.slug}/${stage.slug}`
					// eslint-disable-next-line no-console
					console.log(success(`Content API for project ${project.slug} and stage ${stage.slug} running on ${url}`))
				})
			})
		})

		const monitoringPort = this.config.server.monitoringPort
		const monitoringServer = this.monitoringKoa.listen(monitoringPort, () => {
			console.log(success(`Monitoring running on http://localhost:${monitoringPort}`))
		})

		return [contemberServer, monitoringServer]
	}
}
