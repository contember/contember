import { CreateApiKeyResponse, MutationResolvers } from '../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import Actions from '../../model/authorization/Actions'
import { ForbiddenError } from 'apollo-server-koa'
import AuthorizationScope from '../../../core/authorization/AuthorizationScope'
import ApiKeyManager from '../../model/service/ApiKeyManager'

export default class CreateApiKeyMutationResolver implements MutationResolvers.Resolvers {
	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	async createApiKey(
		parent: any,
		{ projects, roles }: MutationResolvers.CreateApiKeyArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<CreateApiKeyResponse> {
		if (!(await context.isAllowed(new AuthorizationScope.Global(), Actions.API_KEY_CREATE))) {
			throw new ForbiddenError('You are not allowed to create api key')
		}

		const result = await this.apiKeyManager.createPermanentApiKey(
			[...(roles || [])],
			(projects || []).map(it => ({
				variables: [...(it.variables || [])],
				id: it.projectId,
				roles: [...(it.roles || [])],
			}))
		)

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
				id: result.result.apiKey.id,
				token: result.result.apiKey.token,
				identity: {
					id: result.result.identityId,
					projects: [],
				},
			},
		}
	}
}
