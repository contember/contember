import {
	CreateApiKeyErrorCode,
	CreateApiKeyResponse,
	MutationCreateApiKeyArgs, MutationCreateGlobalApiKeyArgs,
	MutationResolvers,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../../ResolverContext'
import { ApiKeyManager, isTokenHash, MembershipValidator, PermissionActions, ProjectManager } from '../../../model'
import { createMembershipValidationErrorResult } from '../../membershipUtils'
import { createProjectNotFoundResponse } from '../../errorUtils'
import { UserInputError } from 'apollo-server-errors'

export class CreateApiKeyMutationResolver implements MutationResolvers {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly projectManager: ProjectManager,
		private readonly membershipValidator: MembershipValidator,
	) {}

	async createApiKey(
		parent: any,
		{ projectSlug, memberships, description, tokenHash }: MutationCreateApiKeyArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<CreateApiKeyResponse> {
		const project = await this.projectManager.getProjectBySlug(context.db, projectSlug)
		await context.requireAccess({
			scope: await context.permissionContext.createProjectScope(project),
			action: PermissionActions.API_KEY_CREATE,
			message: 'You are not allowed to create an API key for this project',
		})
		if (!project) {
			return createProjectNotFoundResponse(CreateApiKeyErrorCode.ProjectNotFound, projectSlug)
		}
		if (typeof tokenHash === 'string' && !isTokenHash(tokenHash)) {
			throw new UserInputError('Invalid format of tokenHash. Must be hex-encoded sha256.')
		}
		const validationResult = await this.membershipValidator.validate(context.projectGroup, project.slug, memberships)
		if (validationResult.length > 0) {
			const errors = createMembershipValidationErrorResult<CreateApiKeyErrorCode>(validationResult)
			return {
				ok: false,
				errors: errors,
				error: errors[0],
			}
		}

		const result = await this.apiKeyManager.createProjectPermanentApiKey(context.db, project.id, memberships, description, tokenHash ?? undefined)

		return {
			ok: true,
			errors: [],
			result: {
				apiKey: result.result.toApiKeyWithToken(),
			},
		}
	}

	async createGlobalApiKey(
		parent: any,
		{ roles, description, tokenHash }: MutationCreateGlobalApiKeyArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<CreateApiKeyResponse> {
		await context.requireAccess({
			action: PermissionActions.API_KEY_CREATE_GLOBAL,
			message: 'You are not allowed to create a global API key',
		})
		if (typeof tokenHash === 'string' && !isTokenHash(tokenHash)) {
			throw new UserInputError('Invalid format of tokenHash. Must be hex-encoded sha256.')
		}
		const result = await this.apiKeyManager.createGlobalPermanentApiKey(context.db, description, roles ?? [], tokenHash ?? undefined)
		return {
			ok: true,
			errors: [],
			result: {
				apiKey: result.result.toApiKeyWithToken(),
			},
		}
	}
}
