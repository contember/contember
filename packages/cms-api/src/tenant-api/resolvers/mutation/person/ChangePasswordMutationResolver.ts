import {
	ChangePasswordErrorCode,
	ChangePasswordResponse,
	MutationChangePasswordArgs,
	MutationResolvers,
} from '../../../schema/types'
import { GraphQLResolveInfo } from 'graphql'
import ResolverContext from '../../ResolverContext'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import Actions from '../../../model/authorization/Actions'
import IdentityScope from '../../../model/authorization/IdentityScope'
import PasswordChangeManager from '../../../model/service/PasswordChangeManager'
import PersonQuery from '../../../model/queries/person/PersonQuery'

export default class ChangePasswordMutationResolver implements MutationResolvers {
	constructor(
		private readonly passwordChangeManager: PasswordChangeManager,
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
	) {}

	async changePassword(
		parent: any,
		args: MutationChangePasswordArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ChangePasswordResponse> {
		const person = await this.queryHandler.fetch(PersonQuery.byId(args.personId))
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
