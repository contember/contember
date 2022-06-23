import {
	DisableApiKeyErrorCode,
	DisableApiKeyResponse,
	MutationDisableApiKeyArgs,
	MutationResolvers,
} from '../../../schema/index.js'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions, ApiKeyManager } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'

export class DisableApiKeyMutationResolver implements MutationResolvers {
	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	async disableApiKey(
		parent: any,
		{ id }: MutationDisableApiKeyArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<DisableApiKeyResponse> {
		await context.requireAccess({
			action: PermissionActions.API_KEY_DISABLE,
			message: 'You are not allowed to disable api key',
		})

		const result = await this.apiKeyManager.disableApiKey(context.db, id)

		if (!result) {
			return createErrorResponse(DisableApiKeyErrorCode.KeyNotFound, 'API key not found')
		}

		return {
			ok: true,
			errors: [],
		}
	}
}
