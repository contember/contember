import Migration from './Migration'
import Project from '../../../config/Project'
import LatestMigrationByStageQuery from '../queries/LatestMigrationByStageQuery'
import MigrationsResolver from '../../../content-schema/MigrationsResolver'
import QueryHandler from '../../../core/query/QueryHandler'
import KnexQueryable from '../../../core/knex/KnexQueryable'

class ProjectMigrationInfoResolver {
	constructor(
		private readonly project: Project,
		private readonly migrationsResolver: MigrationsResolver,
		private readonly queryHandler: QueryHandler<KnexQueryable>
	) {}

	public async getMigrationsInfo(): Promise<ProjectMigrationInfoResolver.Result> {
		const stages = this.project.stages
		const versions = (await Promise.all(
			stages.map(stage => this.queryHandler.fetch(new LatestMigrationByStageQuery(stage.id)))
		)).map(it => (it ? it.data.version : null))
		if (stages.length > 1 && versions.filter(it => it === versions[0]).length !== versions.length) {
			throw new Error(
				'Stages in different versions found: \n' +
					stages.map((stage, i) => `\t${stage.slug}: ${versions[i]}`).join('\n')
			)
		}

		const currentVersion = versions[0]

		// todo check previously executed migrations

		const migrationsToExecute = (await this.migrationsResolver.getMigrations()).filter(
			({ version }) => currentVersion === null || version > currentVersion
		)

		return { currentVersion, migrationsToExecute }
	}
}

namespace ProjectMigrationInfoResolver {
	export interface Result {
		currentVersion: string | null
		migrationsToExecute: Migration[]
	}
}

export default ProjectMigrationInfoResolver
