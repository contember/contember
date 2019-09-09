import {
	AddProjectMemberErrorCode,
	CreateApiKeyErrorCode,
	CreateApiKeyResponse,
	MutationCreateApiKeyArgs,
	MutationResolvers,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../../ResolverContext'
import { ApiKeyManager, PermissionActions, ProjectManager, ProjectScope } from '../../../'
import { AuthorizationScope } from '@contember/authorization'

export class CreateApiKeyMutationResolver implements MutationResolvers {
	constructor(private readonly apiKeyManager: ApiKeyManager, private readonly projectManager: ProjectManager) {}

	async createApiKey(
		parent: any,
		{ projectSlug, memberships }: MutationCreateApiKeyArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<CreateApiKeyResponse> {
		const project = await this.projectManager.getProjectBySlug(projectSlug)
		await context.requireAccess({
			scope: new ProjectScope(project),
			action: PermissionActions.PROJECT_ADD_MEMBER,
			message: 'You are not allowed to add a project member',
		})
		if (!project) {
			return {
				ok: false,
				errors: [{ code: CreateApiKeyErrorCode.ProjectNotFound }],
			}
		}

		const result = await this.apiKeyManager.createProjectPermanentApiKey(project.id, memberships)

		if (!result.ok) {
			return {
				ok: false,
				errors: result.errors.map(errorCode => ({ code: errorCode })),
			}
		}

		return {
			ok: true,
			errors: [],
			result: {
				apiKey: {
					id: result.result.apiKey.id,
					token: result.result.apiKey.token,
					identity: {
						id: result.result.identityId,
						projects: [],
					},
				},
			},
		}
	}
}
