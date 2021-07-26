import { Client, DatabaseQueryable } from '@contember/database'
import { QueryHandler } from '@contember/queryable'
import { CommandBus, CreateProjectCommand, SetProjectSecretCommand } from '../commands'
import { PermissionContext } from '../authorization'
import { Project, ProjectWithSecrets } from '../type'
import { ProjectBySlugQuery, ProjectsByIdentityQuery, ProjectsQuery } from '../queries'
import { SecretsManager } from './SecretsManager'
import { Providers } from '../providers'

export class ProjectManager {
	constructor(
		private readonly client: Client,
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
		private readonly secretManager: SecretsManager,
		private readonly providers: Providers,
	) {}

	public async createProject(
		project: Pick<ProjectWithSecrets, 'name' | 'slug' | 'config' | 'secrets'>,
	): Promise<boolean> {
		return await this.client.transaction(async trx => {
			const bus = new CommandBus(trx, this.providers)

			const id = await bus.execute(new CreateProjectCommand(project))
			if (!id) {
				return false
			}
			for (const [key, value] of Object.entries(project.secrets)) {
				await bus.execute(new SetProjectSecretCommand(id, key, value))
			}

			return true
		})
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
