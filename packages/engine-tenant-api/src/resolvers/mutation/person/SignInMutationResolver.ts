import {
	CreateSessionTokenResponse,
	MutationCreateSessionTokenArgs,
	MutationResolvers,
	MutationSignInArgs,
	SignInResponse,
} from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PermissionActions, PersonUniqueIdentifier, SignInManager } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { SignInResponseFactory } from '../../responseHelpers/SignInResponseFactory'
import { UserInputError } from '@contember/graphql-utils'

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
		let identifier: PersonUniqueIdentifier
		if (args.email) {
			identifier = { type: 'email', email: args.email }
		} else if (args.personId) {
			identifier = { type: 'id', id: args.personId }
		} else {
			throw new UserInputError(`Please provide either email or personId`)
		}

		const response = await this.signInManager.createSessionToken(
			context.db,
			identifier,
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
