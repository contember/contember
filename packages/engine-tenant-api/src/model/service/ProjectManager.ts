import { Client } from '@contember/database'
import { CreateOrUpdateProjectCommand, Project } from '../'

export class ProjectManager {
	constructor(private readonly db: Client) {}

	public async createOrUpdateProject(project: Project) {
		await new CreateOrUpdateProjectCommand(project).execute(this.db)
	}
}
