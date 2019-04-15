import Project from '../type/Project'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import CreateOrUpdateProjectCommand from '../commands/CreateOrUpdateProjectCommand'

export default class ProjectManager {
	constructor(private readonly db: KnexWrapper) {}

	public async createOrUpdateProject(project: Project) {
		await new CreateOrUpdateProjectCommand(project).execute(this.db)
	}
}
