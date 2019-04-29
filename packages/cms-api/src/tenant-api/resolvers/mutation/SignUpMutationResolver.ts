import { MutationResolvers, MutationSignUpArgs, SignUpResponse } from '../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import SignUpManager from '../../model/service/SignUpManager'
import QueryHandler from '../../../core/query/QueryHandler'
import DbQueryable from '../../../core/knex/DbQueryable'
import PersonByIdQuery from '../../model/queries/PersonByIdQuery'
import ImplementationException from '../../../core/exceptions/ImplementationException'
import ProjectsByIdentityQuery from '../../model/queries/ProjectsByIdentityQuery'
import Actions from '../../model/authorization/Actions'
import { ForbiddenError } from 'apollo-server-koa'
import AuthorizationScope from '../../../core/authorization/AuthorizationScope'
import ApiKeyManager from '../../model/service/ApiKeyManager'

export default class SignUpMutationResolver implements MutationResolvers {
	constructor(
		private readonly signUpManager: SignUpManager,
		private readonly queryHandler: QueryHandler<DbQueryable>,
		private readonly apiKeyManager: ApiKeyManager
	) {}

	async signUp(
		parent: any,
		args: MutationSignUpArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<SignUpResponse> {
		if (!(await context.isAllowed(new AuthorizationScope.Global(), Actions.PERSON_SIGN_UP))) {
			throw new ForbiddenError('You are not allowed to sign up')
		}
		const result = await this.signUpManager.signUp(args.email, args.password)

		if (!result.ok) {
			return {
				ok: false,
				errors: result.errors.map(errorCode => ({ code: errorCode })),
			}
		}

		const [personRow, projectRows] = await Promise.all([
			this.queryHandler.fetch(new PersonByIdQuery(result.personId)),
			this.queryHandler.fetch(new ProjectsByIdentityQuery(result.identityId)),
		])

		if (personRow === null) {
			throw new ImplementationException()
		}

		await this.apiKeyManager.disableOneOffApiKey(context.apiKeyId)

		return {
			ok: true,
			errors: [],
			result: {
				person: {
					id: personRow.id,
					email: personRow.email,
					identity: {
						id: result.identityId,
						projects: projectRows,
					},
				},
			},
		}
	}
}
