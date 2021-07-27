import { Client, DatabaseQueryable } from '@contember/database'
import { QueryHandler } from '@contember/queryable'
import { CommandBus, CreateProjectCommand, SetProjectSecretCommand } from '../commands'
import { PermissionContext } from '../authorization'
import { Project, ProjectInitializer, ProjectWithSecrets } from '../type'
import { ProjectBySlugQuery, ProjectsByIdentityQuery, ProjectsQuery } from '../queries'
import { SecretsManager } from './SecretsManager'
import { Providers } from '../providers'
import { DatabaseContext } from '../utils'

export class ProjectManager {
	constructor(
		private readonly dbContext: DatabaseContext,
		private readonly secretManager: SecretsManager,
		private readonly projectIntializer: ProjectInitializer,
	) {}

	public async createProject(
		project: Pick<ProjectWithSecrets, 'name' | 'slug' | 'config' | 'secrets'>,
	): Promise<boolean> {
		return await this.dbContext.transaction(async db => {
			const bus = db.commandBus

			const id = await bus.execute(new CreateProjectCommand(project))
			if (!id) {
				return false
			}
			for (const [key, value] of Object.entries(project.secrets)) {
				await bus.execute(new SetProjectSecretCommand(id, key, value))
			}
			try {
				await this.projectIntializer({
					id,
					...project,
				})
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(e)
				throw new ProjectInitError(`Project initialization error: ${'message' in e ? e.message : 'unknown'}`)
			}

			return true
		})
	}

	public async getProjectBySlug(slug: string): Promise<Project | null> {
		return await this.dbContext.queryHandler.fetch(new ProjectBySlugQuery(slug))
	}

	public async getProjectWithSecretsBySlug(
		slug: string,
	): Promise<(Project & { secrets: Record<string, string> }) | null> {
		const project = await this.dbContext.queryHandler.fetch(new ProjectBySlugQuery(slug))
		if (!project) {
			return null
		}
		const secrets = await this.secretManager.readSecrets(project.id)
		return { ...project, secrets }
	}

	public async getProjects(): Promise<Project[]> {
		return await this.dbContext.queryHandler.fetch(new ProjectsQuery())
	}

	public async getProjectsByIdentity(identityId: string, permissionContext: PermissionContext): Promise<Project[]> {
		return await this.dbContext.queryHandler.fetch(new ProjectsByIdentityQuery(identityId, permissionContext))
	}
}

export class ProjectInitError extends Error {}
