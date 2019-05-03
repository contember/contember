import { MutationResolvers, MutationSetupArgs, SetupResponse } from '../../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../../ResolverContext'
import SignUpManager from '../../../model/service/SignUpManager'
import QueryHandler from '../../../../core/query/QueryHandler'
import DbQueryable from '../../../../core/database/DbQueryable'
import PersonByIdQuery from '../../../model/queries/PersonByIdQuery'
import ImplementationException from '../../../../core/exceptions/ImplementationException'
import Actions from '../../../model/authorization/Actions'
import ApiKeyManager from '../../../model/service/ApiKeyManager'
import Identity from '../../../../common/auth/Identity'

export default class SetupMutationResolver implements MutationResolvers {
	constructor(
		private readonly signUpManager: SignUpManager,
		private readonly queryHandler: QueryHandler<DbQueryable>,
		private readonly apiKeyManager: ApiKeyManager
	) {}

	async setup(
		parent: any,
		args: MutationSetupArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<SetupResponse> {
		await context.requireAccess({
			action: Actions.SYSTEM_SETUP,
			message: 'You are not allowed to setup system',
		})

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
