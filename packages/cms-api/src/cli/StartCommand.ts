import SchemaMigrator from '../content-schema/differ/SchemaMigrator'
import { emptySchema } from '../content-schema/modelUtils'
import MigrationFilesManager from '../migrations/MigrationFilesManager'
import CommandConfiguration from '../core/cli/CommandConfiguration'
import BaseCommand from './BaseCommand'
import Project from '../tenant-api/Project'
import FileNameHelper from '../migrations/FileNameHelper'
import CompositionRoot from '../CompositionRoot'
import { Model } from 'cms-common'

class StartCommand extends BaseCommand<{}, {}> {
	protected configure(configuration: CommandConfiguration): void {
		configuration.name('start')
		configuration.description('Starts a server')
	}

	protected async execute(): Promise<true> {

		const config = await this.readConfig()

		const projectsDirectory = this.getGlobalOptions().projectsDirectory
		const projects: Array<Project> = await Promise.all(config.projects.map(async (project): Promise<Project> => {

			const migrationsFileManager = MigrationFilesManager.createForProject(projectsDirectory, project.slug)
			const diffs = (await migrationsFileManager.readFiles('json'))
				.map(it => ({ name: it.filename, diff: JSON.parse(it.content) }))

			const modelFile = `${this.getGlobalOptions().workingDirectory}/dist/src/projects/${project.slug}/src/model.js`
			const acl = (await import(modelFile)).default.acl
			return {
				...project,
				stages: project.stages.map((stage) => {
					const model = diffs.filter(({ name }) => name.substring(0, FileNameHelper.prefixLength) <= stage.migration)
						.map(({ diff }) => diff)
						.reduce<Model.Schema>((schema, diff) => SchemaMigrator.applyDiff(schema, diff), emptySchema)
					return {
						...stage,
						schema: { model, acl }
					}
				})
			}
		}))
		const compositionRoot = new CompositionRoot()
		const httpServer = compositionRoot.composeServer(config.tenant.db, projects)
		httpServer.listen(Number.parseInt(String(config.server.port)), () => {
			console.log(`Tenant API running on http://localhost:${config.server.port}/tenant`)
			projects.forEach(project => {
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
