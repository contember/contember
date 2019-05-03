import { MutationResolvers, MutationSignInArgs, SignInResponse } from '../../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../../ResolverContext'
import SignInManager from '../../../model/service/SignInManager'
import ImplementationException from '../../../../core/exceptions/ImplementationException'
import QueryHandler from '../../../../core/query/QueryHandler'
import DbQueryable from '../../../../core/database/DbQueryable'
import PersonByIdQuery from '../../../model/queries/PersonByIdQuery'
import ProjectsByIdentityQuery from '../../../model/queries/ProjectsByIdentityQuery'
import Actions from '../../../model/authorization/Actions'

export default class SignInMutationResolver implements MutationResolvers {
	constructor(
		private readonly signInManager: SignInManager,
		private readonly queryHandler: QueryHandler<DbQueryable>
	) {}

	async signIn(
		parent: any,
		args: MutationSignInArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<SignInResponse> {
		await context.requireAccess({
			action: Actions.PERSON_SIGN_IN,
			message: 'You are not allowed to sign in',
		})

		const result = await this.signInManager.signIn(args.email, args.password, args.expiration || undefined)

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
