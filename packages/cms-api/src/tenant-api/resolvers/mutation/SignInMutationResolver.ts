import { MutationResolvers, SignInResponse } from '../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../ResolverContext'
import SignInManager from '../../model/service/SignInManager'
import ImplementationException from '../../../core/exceptions/ImplementationException'
import QueryHandler from '../../../core/query/QueryHandler'
import KnexQueryable from '../../../core/knex/KnexQueryable'
import PersonByIdQuery from '../../model/queries/PersonByIdQuery'
import ProjectsByIdentityQuery from '../../model/queries/ProjectsByIdentityQuery'
import Actions from '../../model/authorization/Actions'
import { ForbiddenError } from 'apollo-server-koa'
import AuthorizationScope from '../../../core/authorization/AuthorizationScope'

export default class SignInMutationResolver implements MutationResolvers.Resolvers {
	constructor(
		private readonly signInManager: SignInManager,
		private readonly queryHandler: QueryHandler<KnexQueryable>
	) {}

	async signIn(
		parent: any,
		args: MutationResolvers.SignInArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<SignInResponse> {
		if (!(await context.isAllowed(new AuthorizationScope.Global(), Actions.PERSON_SIGN_IN))) {
			throw new ForbiddenError('You are not allowed to sign in')
		}

		const result = await this.signInManager.signIn(args.email, args.password)

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

		return {
			ok: true,
			errors: [],
			result: {
				token: result.token,
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
