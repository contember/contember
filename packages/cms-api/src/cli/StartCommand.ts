import MigrationFilesManager from '../migrations/MigrationFilesManager'
import CommandConfiguration from '../core/cli/CommandConfiguration'
import BaseCommand from './BaseCommand'
import CompositionRoot from '../CompositionRoot'
import ProjectSchemaInfo from '../config/ProjectSchemaInfo'
import Project from '../config/Project'
import SchemaMigrationDiffsResolver from '../content-schema/SchemaMigrationDiffsResolver'

class StartCommand extends BaseCommand<{}, {}> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.name('start')
		configuration.description('Starts a server')
	}

	protected async execute(): Promise<true> {
		const config = await this.readConfig()

		const projectsDirectory = this.getGlobalOptions().projectsDirectory
		const projects: (ProjectSchemaInfo & Project)[] = await Promise.all(
			config.projects.map(
				async (project): Promise<ProjectSchemaInfo & Project> => {
					const modelFile = `${this.getGlobalOptions().workingDirectory}/dist/src/projects/${project.slug}/src/model.js`
					const acl = (await import(modelFile)).default.acl
					return {
						...project,
						acl,
					}
				}
			)
		)
		const compositionRoot = new CompositionRoot()
		const httpServer = compositionRoot.composeServer(config.tenant.db, projects, projectsDirectory)
		httpServer.listen(Number.parseInt(String(config.server.port)), () => {
			console.log(`Tenant API running on http://localhost:${config.server.port}/tenant`)
			config.projects.forEach(project => {
				const url = `http://localhost:${config.server.port}/system/${project.slug}`
				console.log(`System API for project ${project.slug} running on ${url}`)
				project.stages.forEach(stage => {
					const url = `http://localhost:${config.server.port}/content/${project.slug}/${stage.slug}`
					console.log(`Content API for project ${project.slug} and stage ${stage.slug} running on ${url}`)
				})
			})
		})
		return true
	}
}

export default StartCommand
