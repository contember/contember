import { DatabaseQueryable } from '@contember/database'
import { QueryHandler } from '@contember/queryable'
import { CommandBus } from '../commands'
import { PermissionContext } from '../authorization'
import { Project } from '../type'
import { CreateOrUpdateProjectCommand } from '../commands'
import { ProjectBySlugQuery, ProjectsByIdentityQuery } from '../queries'

export class ProjectManager {
	constructor(
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
		private readonly commandBus: CommandBus,
	) {}

	public async createOrUpdateProject(project: Pick<Project, 'name' | 'slug'>): Promise<boolean> {
		return await this.commandBus.execute(new CreateOrUpdateProjectCommand(project))
	}

	public async getProjectBySlug(slug: string): Promise<Project | null> {
		return await this.queryHandler.fetch(new ProjectBySlugQuery(slug))
	}

	public async getProjectsByIdentity(identityId: string, permissionContext: PermissionContext) {
		return await this.queryHandler.fetch(new ProjectsByIdentityQuery(identityId, permissionContext))
	}
}
