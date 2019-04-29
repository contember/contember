import Project from '../type/Project'
import Client from '../../../core/database/Client'
import CreateOrUpdateProjectCommand from '../commands/CreateOrUpdateProjectCommand'

export default class ProjectManager {
	constructor(private readonly db: Client) {}

	public async createOrUpdateProject(project: Project) {
		await new CreateOrUpdateProjectCommand(project).execute(this.db)
	}
}
