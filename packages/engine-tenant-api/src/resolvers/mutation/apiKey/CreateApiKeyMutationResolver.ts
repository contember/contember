import {
	CreateApiKeyErrorCode,
	CreateApiKeyResponse,
	MutationCreateApiKeyArgs,
	MutationResolvers,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../../ResolverContext'
import { ApiKeyManager, PermissionActions, ProjectManager, ProjectScope } from '../../../model'
import { MembershipValidator } from '../../../model/service/MembershipValidator'
import { createMembershipValidationErrorResult } from '../../utils'

export class CreateApiKeyMutationResolver implements MutationResolvers {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly projectManager: ProjectManager,
		private readonly membershipValidator: MembershipValidator,
	) {}

	async createApiKey(
		parent: any,
		{ projectSlug, memberships, description }: MutationCreateApiKeyArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<CreateApiKeyResponse> {
		const project = await this.projectManager.getProjectBySlug(projectSlug)
		await context.requireAccess({
			scope: await context.permissionContext.createProjectScope(project),
			action: PermissionActions.API_KEY_CREATE,
			message: 'You are not allowed to create an API key for this project',
		})
		if (!project) {
			return {
				ok: false,
				errors: [{ code: CreateApiKeyErrorCode.ProjectNotFound }],
			}
		}

		const validationResult = await this.membershipValidator.validate(project.slug, memberships)
		if (validationResult.length > 0) {
			return {
				ok: false,
				errors: createMembershipValidationErrorResult(validationResult),
			}
		}

		const result = await this.apiKeyManager.createProjectPermanentApiKey(project.id, memberships, description)

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
