import {
	CreateSessionTokenResponse,
	MutationCreateSessionTokenArgs,
	MutationResolvers,
	MutationSignInArgs,
	SignInResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions, SignInManager } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { SignInResponseFactory } from '../../responseHelpers/SignInResponseFactory.js'

export class SignInMutationResolver implements MutationResolvers {
	constructor(
		private readonly signInManager: SignInManager,
		private readonly signInResponseFactory: SignInResponseFactory,
	) {}

	async signIn(parent: any, args: MutationSignInArgs, context: TenantResolverContext): Promise<SignInResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_IN,
			message: 'You are not allowed to sign in',
		})

		const response = await this.signInManager.signIn(
			context.db,
			args.email,
			args.password,
			args.expiration || undefined,
			args.otpToken || undefined,
		)

		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}
		return {
			ok: true,
			errors: [],
			result: await this.signInResponseFactory.createResponse(response.result, context),
		}
	}

	async createSessionToken(parent: any, args: MutationCreateSessionTokenArgs, context: TenantResolverContext): Promise<CreateSessionTokenResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_CREATE_SESSION_KEY,
			message: 'You are not allowed to create a session key',
		})

		const response = await this.signInManager.createSessionToken(
			context.db,
			args.email,
			args.expiration || undefined,
		)

		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}
		return {
			ok: true,
			result: await this.signInResponseFactory.createResponse(response.result, context),
		}
	}
}
