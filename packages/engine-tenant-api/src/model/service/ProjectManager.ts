import { AddProjectMemberCommand, CreateProjectCommand, SetProjectSecretCommand, UpdateProjectCommand } from '../commands'
import { PermissionContext } from '../authorization'
import { Project, ProjectInitializer, ProjectWithSecrets } from '../type'
import { ProjectBySlugQuery, ProjectsByIdentityQuery, ProjectsQuery, ProjectUpdateTimestampQuery } from '../queries'
import { SecretsManager } from './SecretsManager'
import { DatabaseContext } from '../utils'
import { createSetMembershipVariables } from './membershipUtils'
import { ImplementationException } from '../../exceptions'
import { ProjectRole } from '@contember/schema'
import { ApiKeyService, CreateApiKeyResult } from './apiKey'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { CreateProjectResponseErrorCode } from '../../schema'

export class ProjectManager {
	constructor(
		private readonly dbContext: DatabaseContext,
		private readonly secretManager: SecretsManager,
		private readonly projectIntializer: ProjectInitializer,
		private readonly apiKeyService: ApiKeyService,
	) {}

	public async createProject(
		project: Pick<ProjectWithSecrets, 'name' | 'slug' | 'config' | 'secrets'>,
		ownerIdentityId: string | undefined,
	): Promise<CreateProjectResponse> {
		return await this.dbContext.transaction(async db => {
			const bus = db.commandBus

			const now = db.providers.now()
			const projectId = await bus.execute(new CreateProjectCommand(project, now))
			if (!projectId) {
				return new ResponseError(CreateProjectResponseErrorCode.AlreadyExists, `Project ${project.slug} already exists`)
			}
			for (const [key, value] of Object.entries(project.secrets)) {
				await bus.execute(new SetProjectSecretCommand(projectId, key, value))
			}
			if (ownerIdentityId) {
				const addMemberResult = await db.commandBus.execute(
					new AddProjectMemberCommand(projectId, ownerIdentityId, createSetMembershipVariables([{ role: ProjectRole.ADMIN, variables: [] }])),
				)
				if (!addMemberResult.ok) {
					throw new ImplementationException()
				}

			}

			const deployMembership = [{ role: ProjectRole.DEPLOYER, variables: [] }]
			const deployResult = await this.apiKeyService.createProjectPermanentApiKey(db, projectId, deployMembership, `Deploy key for ${project.slug}`)

			try {
				await this.projectIntializer.initializeProject({
					id: projectId,
					...project,
					updatedAt: now,
				})
			} catch (e) {
				// eslint-disable-next-line no-console
				console.error(e)
				await db.client.connection.rollback()
				return new ResponseError(CreateProjectResponseErrorCode.InitError, `Project initialization error: ${'message' in e ? e.message : 'unknown'}`)
			}

			return new ResponseOk(new CreateProjectResult(deployResult.result))
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


export type CreateProjectResponse = Response<CreateProjectResult, CreateProjectResponseErrorCode>

export class CreateProjectResult {
	constructor(public readonly deployerApiKey: CreateApiKeyResult) {
	}
}
