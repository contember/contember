import {
	CreateApiKeyErrorCode,
	CreateApiKeyResponse,
	MutationCreateApiKeyArgs,
	MutationCreateGlobalApiKeyArgs,
	MutationResolvers,
} from '../../../schema/index.js'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { ApiKeyManager, isTokenHash, MembershipValidator, PermissionActions, ProjectManager } from '../../../model/index.js'
import { createMembershipValidationErrorResult } from '../../membershipUtils.js'
import { createProjectNotFoundResponse } from '../../errorUtils.js'
import { UserInputError } from '@contember/graphql-utils'
import { ResponseOk } from '../../../model/utils/Response.js'
import { Acl, JSONValue } from '@contember/schema'

export class CreateApiKeyMutationResolver implements MutationResolvers {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly projectManager: ProjectManager,
		private readonly membershipValidator: MembershipValidator,
	) {}

	async createApiKey(
		parent: any,
		{ projectSlug, memberships, description, tokenHash, options }: MutationCreateApiKeyArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<CreateApiKeyResponse> {
		const project = await this.projectManager.getProjectBySlug(context.db, projectSlug)
		await context.requireAccess({
			project,
			action: PermissionActions.API_KEY_CREATE,
			message: 'You are not allowed to create an API key for this project',
		})
		if (!project) {
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', projectSlug)
		}
		if (typeof tokenHash === 'string' && !isTokenHash(tokenHash)) {
			throw new UserInputError('Invalid format of tokenHash. Must be hex-encoded sha256.')
		}
		const validationResult = await this.membershipValidator.validate(project.slug, memberships)
		if (validationResult.length > 0) {
			const errors = createMembershipValidationErrorResult(validationResult)
			return {
				ok: false,
				errors: errors,
				error: errors[0],
			}
		}

		const result = await this.apiKeyManager.createProjectPermanentApiKey(
			context.db,
			project.id,
			memberships,
			description,
			tokenHash ?? undefined,
			options?.trustForwardedClientInfo === true,
		)

		await context.logAuthAction({
			type: 'api_key_create',
			response: new ResponseOk(null),
			eventData: {
				scope: 'project',
				projectSlug: project.slug,
				apiKeyId: result.result.apiKey.id,
				identityId: result.result.identity.id,
				description,
				memberships: memberships.map(membershipToJson),
			},
		})

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
		{ roles, description, tokenHash, options }: MutationCreateGlobalApiKeyArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<CreateApiKeyResponse> {
		roles ??= []
		await context.requireAccess({
			action: PermissionActions.API_KEY_CREATE_GLOBAL(roles),
			message: 'You are not allowed to create a global API key',
		})
		if (typeof tokenHash === 'string' && !isTokenHash(tokenHash)) {
			throw new UserInputError('Invalid format of tokenHash. Must be hex-encoded sha256.')
		}
		const result = await this.apiKeyManager.createGlobalPermanentApiKey(
			context.db,
			description,
			roles,
			tokenHash ?? undefined,
			options?.trustForwardedClientInfo === true,
		)

		await context.logAuthAction({
			type: 'api_key_create',
			response: new ResponseOk(null),
			eventData: {
				scope: 'global',
				apiKeyId: result.result.apiKey.id,
				identityId: result.result.identity.id,
				description,
				roles: [...roles],
			},
		})

		return {
			ok: true,
			errors: [],
			result: {
				apiKey: result.result.toApiKeyWithToken(),
			},
		}
	}
}

const membershipToJson = ({ role, variables }: Acl.Membership): JSONValue => ({
	role,
	variables: variables.map(({ name, values }) => ({ name, values: [...values] })),
})
