import { DatabaseQueryable } from '@contember/database'
import { QueryHandler } from '@contember/queryable'
import { CommandBus, CreateProjectCommand } from '../commands'
import { PermissionContext } from '../authorization'
import { Project } from '../type'
import { ProjectBySlugQuery, ProjectsByIdentityQuery, ProjectsQuery } from '../queries'
import { SecretsManager } from './SecretsManager'

export class ProjectManager {
	constructor(
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
		private readonly commandBus: CommandBus,
		private readonly secretManager: SecretsManager,
	) {}

	public async createProject(project: Pick<Project, 'name' | 'slug' | 'config'>): Promise<boolean> {
		return await this.commandBus.execute(new CreateProjectCommand(project))
	}

	public async getProjectBySlug(slug: string): Promise<Project | null> {
		return await this.queryHandler.fetch(new ProjectBySlugQuery(slug))
	}

	public async getProjectWithSecretsBySlug(
		slug: string,
	): Promise<(Project & { secrets: Record<string, string> }) | null> {
		const project = await this.queryHandler.fetch(new ProjectBySlugQuery(slug))
		if (!project) {
			return null
		}
		const secrets = await this.secretManager.readSecrets(project.id)
		return { ...project, secrets }
	}

	public async getProjects(): Promise<Project[]> {
		return await this.queryHandler.fetch(new ProjectsQuery())
	}

	public async getProjectsByIdentity(identityId: string, permissionContext: PermissionContext): Promise<Project[]> {
		return await this.queryHandler.fetch(new ProjectsByIdentityQuery(identityId, permissionContext))
	}
}
