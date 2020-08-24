import {
	CreatePasswordResetRequestErrorCode,
	CreatePasswordResetRequestResponse,
	MutationCreateResetPasswordRequestArgs,
	MutationResetPasswordArgs,
	MutationResolvers,
	ResetPasswordErrorCode as SchemaResetPasswordErrorCode,
	ResetPasswordResponse,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../../ResolverContext'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import {
	PasswordResetManager,
	PermissionActions,
	PersonQuery,
	ResetPasswordErrorCode,
	ResetPasswordCommandErrorCode,
} from '../../../model'

export class ResetPasswordMutationResolver implements MutationResolvers {
	constructor(
		private readonly passwordResetManager: PasswordResetManager,
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
	) {}

	async createResetPasswordRequest(
		parent: any,
		args: MutationCreateResetPasswordRequestArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<CreatePasswordResetRequestResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_RESET_PASSWORD,
			message: 'You are not allowed to initialize reset password request',
		})
		const person = await this.queryHandler.fetch(PersonQuery.byEmail(args.email))
		if (!person) {
			return {
				ok: false,
				errors: [{ code: CreatePasswordResetRequestErrorCode.PersonNotFound }],
			}
		}

		await this.passwordResetManager.createPasswordResetRequest(person, {
			mailVariant: args.options?.mailVariant || undefined,
			project: args.options?.mailProject || undefined,
		})
		return { ok: true, errors: [] }
	}

	async resetPassword(
		parent: any,
		args: MutationResetPasswordArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<ResetPasswordResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_RESET_PASSWORD,
			message: 'You are not allowed to perform reset password reset',
		})

		const result = await this.passwordResetManager.resetPassword(args.token, args.password)
		if (result.ok) {
			return { ok: true, errors: [] }
		}
		const err = result.error
		return {
			ok: false,
			errors: [
				{
					code: {
						[ResetPasswordErrorCode.PASSWORD_TOO_WEAK]: SchemaResetPasswordErrorCode.PasswordTooWeak,
						[ResetPasswordCommandErrorCode.TOKEN_EXPIRED]: SchemaResetPasswordErrorCode.TokenExpired,
						[ResetPasswordCommandErrorCode.TOKEN_NOT_FOUND]: SchemaResetPasswordErrorCode.TokenNotFound,
						[ResetPasswordCommandErrorCode.TOKEN_USED]: SchemaResetPasswordErrorCode.TokenUsed,
					}[err],
				},
			],
		}
	}
}
