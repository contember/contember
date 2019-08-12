import {
	DisableApiKeyErrorCode,
	DisableApiKeyResponse,
	MutationDisableApiKeyArgs,
	MutationResolvers,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ApiKeyManager } from '../../../'

export class DisableApiKeyMutationResolver implements MutationResolvers {
	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	async disableApiKey(
		parent: any,
		{ id }: MutationDisableApiKeyArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<DisableApiKeyResponse> {
		await context.requireAccess({
			action: PermissionActions.API_KEY_DISABLE,
			message: 'You are not allowed to disable api key',
		})

		const result = await this.apiKeyManager.disableApiKey(id)

		if (!result) {
			return {
				ok: false,
				errors: [{ code: DisableApiKeyErrorCode.KeyNotFound }],
			}
		}

		return {
			ok: true,
			errors: [],
		}
	}
}
