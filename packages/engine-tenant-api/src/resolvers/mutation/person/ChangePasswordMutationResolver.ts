import {
	ChangePasswordErrorCode,
	ChangePasswordResponse,
	MutationChangePasswordArgs,
	MutationResolvers,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../../ResolverContext'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import { PermissionActions, IdentityScope, PasswordChangeManager, PersonQuery } from '../../../model'

export class ChangePasswordMutationResolver implements MutationResolvers {
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
			action: PermissionActions.PERSON_CHANGE_PASSWORD,
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
