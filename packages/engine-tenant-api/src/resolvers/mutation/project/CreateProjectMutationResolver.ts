import {
	CreateProjectResponse,
	CreateProjectResponseErrorCode,
	MutationCreateProjectArgs,
	MutationResolvers,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { isTokenHash, PermissionActions, ProjectManager } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { UserInputError } from 'apollo-server-errors'

export class CreateProjectMutationResolver implements MutationResolvers {
	constructor(private readonly projectManager: ProjectManager) {}

	async createProject(
		parent: any,
		{ projectSlug, name, config, deployTokenHash, secrets }: MutationCreateProjectArgs,
		context: ResolverContext,
	): Promise<CreateProjectResponse> {
		await context.requireAccess({
			action: PermissionActions.PROJECT_CREATE,
			message: 'You are not allowed to create a project',
		})
		const project = await this.projectManager.getProjectBySlug(context.db, projectSlug)
		if (project) {
			return createErrorResponse(CreateProjectResponseErrorCode.AlreadyExists, `Project ${projectSlug} already exists`)
		}
		if (typeof deployTokenHash === 'string' && !isTokenHash(deployTokenHash)) {
			throw new UserInputError('Invalid format of deployTokenHash. Must be hex-encoded sha256.')
		}
		const response = await this.projectManager.createProject(
			context.projectGroup,
			{
				slug: projectSlug,
				name: name || projectSlug,
				config: config || {},
				secrets: Object.fromEntries((secrets || []).map(it => [it.key, it.value])),
			},
			context.identity.id,
			deployTokenHash ?? undefined,
		)
		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}
		return {
			ok: true,
			error: null,
			result: {
				deployerApiKey: response.result.deployerApiKey.toApiKeyWithToken(),
			},
		}
	}
}
