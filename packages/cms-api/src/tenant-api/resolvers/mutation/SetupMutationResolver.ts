import { MutationResolvers, SetupResponse } from '../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import SignUpManager from '../../model/service/SignUpManager'
import QueryHandler from '../../../core/query/QueryHandler'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import PersonByIdQuery from '../../model/queries/PersonByIdQuery'
import ImplementationException from '../../../core/exceptions/ImplementationException'
import Actions from '../../model/authorization/Actions'
import { ForbiddenError } from 'apollo-server-koa'
import AuthorizationScope from '../../../core/authorization/AuthorizationScope'
import ApiKeyManager from '../../model/service/ApiKeyManager'
import Identity from '../../../common/auth/Identity'

export default class SetupMutationResolver implements MutationResolvers.Resolvers {
	constructor(
		private readonly signUpManager: SignUpManager,
		private readonly queryHandler: QueryHandler<KnexQueryable>,
		private readonly apiKeyManager: ApiKeyManager
	) {}

	async setup(
		parent: any,
		args: MutationResolvers.SetupArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<SetupResponse> {
		if (!(await context.isAllowed(new AuthorizationScope.Global(), Actions.SYSTEM_SETUP))) {
			throw new ForbiddenError('You are not allowed to setup system')
		}
		const { email, password } = args.superadmin
		const result = await this.signUpManager.signUp(email, password, [Identity.SystemRole.SUPER_ADMIN])

		if (!result.ok) {
			throw new ImplementationException()
		}

		const personRow = await this.queryHandler.fetch(new PersonByIdQuery(result.personId))

		if (personRow === null) {
			throw new ImplementationException()
		}

		const loginToken = await this.apiKeyManager.createLoginApiKey()

		await this.apiKeyManager.disableOneOffApiKey(context.apiKeyId)

		return {
			ok: true,
			errors: [],
			result: {
				loginKey: {
					id: loginToken.apiKey.id,
					token: loginToken.apiKey.token,
					identity: {
						id: loginToken.identityId,
						projects: [],
					},
				},
				superadmin: {
					id: personRow.id,
					email: personRow.email,
					identity: {
						id: result.identityId,
						projects: [],
					},
				},
			},
		}
	}
}
