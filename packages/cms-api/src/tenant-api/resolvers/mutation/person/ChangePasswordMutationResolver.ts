import {
	ChangePasswordErrorCode,
	ChangePasswordResponse,
	MutationChangePasswordArgs,
	MutationResolvers,
} from '../../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../../ResolverContext'
import QueryHandler from '../../../../core/query/QueryHandler'
import DbQueryable from '../../../../core/database/DbQueryable'
import PersonByIdQuery from '../../../model/queries/PersonByIdQuery'
import Actions from '../../../model/authorization/Actions'
import IdentityScope from '../../../model/authorization/IdentityScope'
import PasswordChangeManager from '../../../model/service/PasswordChangeManager'

export default class ChangePasswordMutationResolver implements MutationResolvers {
	constructor(
		private readonly passwordChangeManager: PasswordChangeManager,
		private readonly queryHandler: QueryHandler<DbQueryable>
	) {}

	async changePassword(
		parent: any,
		args: MutationChangePasswordArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo
	): Promise<ChangePasswordResponse> {
		const person = await this.queryHandler.fetch(new PersonByIdQuery(args.personId))
		if (!person) {
			return {
				ok: false,
				errors: [{ code: ChangePasswordErrorCode.PersonNotFound }],
			}
		}

		await context.requireAccess({
			scope: new IdentityScope(person.identity_id),
			action: Actions.PERSON_SIGN_IN,
			message: 'You are not allowed to change password',
		})
		const result = await this.passwordChangeManager.changePassword(args.personId, args.password)

		if (!result.ok) {
			return {
				ok: false,
				errors: result.errors.map(errorCode => ({ code: errorCode })),
			}
		}

		return { ok: true, errors: [] }
	}
}
