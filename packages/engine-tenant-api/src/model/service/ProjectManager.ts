import { Client, DatabaseQueryable } from '@contember/database'
import { QueryHandler } from '@contember/queryable'
import { CommandBus, CreateProjectCommand, SetProjectSecretCommand, UpdateProjectCommand } from '../commands'
import { PermissionContext } from '../authorization'
import { Project, ProjectInitializer, ProjectWithSecrets } from '../type'
import { ProjectBySlugQuery, ProjectsByIdentityQuery, ProjectsQuery, ProjectUpdateTimestampQuery } from '../queries'
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

			const now = db.providers.now()
			const id = await bus.execute(new CreateProjectCommand(project, now))
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
					updatedAt: now,
				})
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(e)
				throw new ProjectInitError(`Project initialization error: ${'message' in e ? e.message : 'unknown'}`)
			}

			return true
		})
	}

	public async updateProject(id: string, data: Partial<Pick<Project, 'name' | 'config'>>): Promise<void> {
		await this.dbContext.commandBus.execute(new UpdateProjectCommand(id, data))
	}

	public async getProjectBySlug(slug: string): Promise<Project | null> {
		return await this.dbContext.queryHandler.fetch(new ProjectBySlugQuery(slug))
	}

	public async getProjectState(slug: string, updatedAt: Date): Promise<'valid' | 'updated' | 'not_found'> {
		const updatedNew = await this.dbContext.queryHandler.fetch(new ProjectUpdateTimestampQuery(slug))
		if (!updatedNew) {
			return 'not_found'
		}
		return updatedNew > updatedAt ? 'updated' : 'valid'
	}

	public async getProjectWithSecretsBySlug(slug: string, alias: boolean): Promise<ProjectWithSecrets | null> {
		const project = await this.dbContext.queryHandler.fetch(new ProjectBySlugQuery(slug, alias))
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
