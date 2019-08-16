import { Client, DatabaseQueryable } from '@contember/database'
import { CreateOrUpdateProjectCommand, Project, ProjectBySlugQuery } from '../'
import { QueryHandler } from '@contember/queryable'

export class ProjectManager {
	constructor(private readonly queryHandler: QueryHandler<DatabaseQueryable>, private readonly db: Client) {}

	public async createOrUpdateProject(project: Pick<Project, 'name' | 'slug'>) {
		await new CreateOrUpdateProjectCommand(project).execute(this.db)
	}

	public async getProjectBySlug(slug: string): Promise<Project | null> {
		return await this.queryHandler.fetch(new ProjectBySlugQuery(slug))
	}
}
