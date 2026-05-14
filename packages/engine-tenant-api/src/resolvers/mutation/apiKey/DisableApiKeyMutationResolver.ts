import { DisableApiKeyErrorCode, DisableApiKeyResponse, MutationDisableApiKeyArgs, MutationResolvers } from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext'
import { ApiKeyManager, PermissionActions } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { ResponseOk } from '../../../model/utils/Response'

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
			return createErrorResponse('KEY_NOT_FOUND', 'API key not found')
		}

		await context.logAuthAction({
			type: 'api_key_disable',
			response: new ResponseOk(null),
			changeDiff: { apiKeyId: id },
		})

		return {
			ok: true,
			errors: [],
		}
	}
}
