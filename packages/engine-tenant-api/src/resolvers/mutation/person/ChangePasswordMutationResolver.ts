import {
	ChangeMyPasswordErrorCode,
	ChangeMyPasswordResponse,
	ChangePasswordErrorCode,
	ChangePasswordResponse,
	MutationChangeMyPasswordArgs,
	MutationChangePasswordArgs,
	MutationResolvers,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../../ResolverContext'
import { DatabaseContext, IdentityScope, PasswordChangeManager, PermissionActions, PersonQuery } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

export class ChangePasswordMutationResolver implements MutationResolvers {
	constructor(
		private readonly passwordChangeManager: PasswordChangeManager,
		private readonly dbContext: DatabaseContext,
	) {}

	async changePassword(
		parent: unknown,
		args: MutationChangePasswordArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ChangePasswordResponse> {
		const person = await this.dbContext.queryHandler.fetch(PersonQuery.byId(args.personId))
		if (!person) {
			return createErrorResponse(ChangePasswordErrorCode.PersonNotFound, 'Person not found')
		}

		await context.requireAccess({
			scope: new IdentityScope(person.identity_id),
			action: PermissionActions.PERSON_CHANGE_PASSWORD,
			message: 'You are not allowed to change password',
		})
		const result = await this.passwordChangeManager.changePassword(args.personId, args.password)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return { ok: true, errors: [] }
	}

	async changeMyPassword(
		parent: unknown,
		args: MutationChangeMyPasswordArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ChangeMyPasswordResponse> {
		const person = await this.dbContext.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			return createErrorResponse(ChangeMyPasswordErrorCode.NotAPerson, 'Only a person can change a password')
		}
		await context.requireAccess({
			action: PermissionActions.PERSON_CHANGE_MY_PASSWORD,
			message: 'You are not allowed to change password',
		})
		const result = await this.passwordChangeManager.changeMyPassword(person, args.currentPassword, args.newPassword)

		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return { ok: true }
	}
}
