import CommandConfiguration from '../core/cli/CommandConfiguration'
import Koa from 'koa'
import { Config } from '../config/config'
import Command from '../core/cli/Command'

class StartCommand extends Command<{}, {}> {
	constructor(private readonly koa: Koa, private readonly config: Config) {
		super()
	}

	protected configure(configuration: CommandConfiguration): void {
		configuration.description('Starts a server')
	}

	protected async execute(): Promise<true> {
		const port = this.config.server.port
		this.koa.listen(Number.parseInt(String(port)), () => {
			console.log(`Tenant API running on http://localhost:${port}/tenant`)
			this.config.projects.forEach(project => {
				const url = `http://localhost:${port}/system/${project.slug}`
				console.log(`System API for project ${project.slug} running on ${url}`)
				project.stages.forEach(stage => {
					const url = `http://localhost:${port}/content/${project.slug}/${stage.slug}`
					console.log(`Content API for project ${project.slug} and stage ${stage.slug} running on ${url}`)
				})
			})
		})
		return true
	}
}

export default StartCommand
