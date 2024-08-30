import {
	CreatePasswordResetRequestResponse,
	MutationCreateResetPasswordRequestArgs,
	MutationResetPasswordArgs,
	MutationResolvers,
	ResetPasswordResponse,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PasswordResetManager, PermissionActions, PermissionContextFactory, PersonQuery } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

export class ResetPasswordMutationResolver implements MutationResolvers {
	constructor(
		private readonly passwordResetManager: PasswordResetManager,
		private readonly permissionContextFactory: PermissionContextFactory,
	) {}

	async createResetPasswordRequest(
		parent: any,
		args: MutationCreateResetPasswordRequestArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<CreatePasswordResetRequestResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_RESET_PASSWORD,
			message: 'You are not allowed to initialize reset password request',
		})
		const person = await context.db.queryHandler.fetch(PersonQuery.byEmail(args.email))
		if (!person) {
			return createErrorResponse('PERSON_NOT_FOUND', 'Person was not found.')
		}

		const permissionContext = await this.permissionContextFactory.create(context.db, {
			id: person.identity_id,
			roles: person.roles,
		})
		await this.passwordResetManager.createPasswordResetRequest(context.db, permissionContext, person, {
			mailVariant: args.options?.mailVariant || undefined,
			project: args.options?.mailProject || undefined,
		})
		return { ok: true, errors: [] }
	}

	async resetPassword(
		parent: any,
		args: MutationResetPasswordArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ResetPasswordResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_RESET_PASSWORD,
			message: 'You are not allowed to perform reset password reset',
		})

		const result = await this.passwordResetManager.resetPassword(context.db, args.token, args.password)
		if (result.ok) {
			return { ok: true, errors: [] }
		}
		return createErrorResponse(result.error, result.errorMessage)
	}
}
