import { CreateSessionTokenResponse, MutationCreateSessionTokenArgs, MutationResolvers, MutationSignInArgs, SignInResponse } from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { ConfigurationQuery, PermissionActions, PersonUniqueIdentifier, SignInManager } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { SignInResponseFactory } from '../../responseHelpers/SignInResponseFactory'
import { UserInputError } from '@contember/graphql-utils'
import { NextLoginAttemptQuery } from '../../../model/queries/authLog/NextLoginAttemptQuery'
import { ResponseError } from '../../../model/utils/Response'

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

		const nextAllowedSignIn = await context.db.queryHandler.fetch(new NextLoginAttemptQuery(args.email))
		if (nextAllowedSignIn > new Date()) {
			return createErrorResponse(new ResponseError('RATE_LIMIT_EXCEEDED', `Too many attempts, please try again later.`, {
				retryAfter: Math.ceil((nextAllowedSignIn.getTime() - Date.now()) / 1000),
			}))
		}

		const response = await this.signInManager.signIn(
			context.db,
			args.email,
			args.password,
			args.expiration || undefined,
			args.otpToken || undefined,
		)
		await context.logAuthAction({
			type: 'login',
			response,
		})


		if (!response.ok) {
			const configuration = await context.db.queryHandler.fetch(new ConfigurationQuery())
			if (!configuration.login.revealUserExists && ['NO_PASSWORD_SET', 'NO_PASSWORD_SET', 'PERSON_DISABLED', 'INVALID_PASSWORD'].includes(response.error)) {
				// if the user does not exist, we don't want to reveal that, so we return a generic error
				return createErrorResponse('INVALID_CREDENTIALS', 'Invalid credentials')
			}
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
			action: PermissionActions.PERSON_CREATE_SESSION_KEY(),
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
			async person => await context.requireAccess({
				action: PermissionActions.PERSON_CREATE_SESSION_KEY(person.roles),
				message: 'You are not allowed to create a session key for this person.',
			}),
		)
		await context.logAuthAction({
			type: 'create_session_token',
			response: response,
		})

		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}

		return {
			ok: true,
			result: await this.signInResponseFactory.createResponse(response.result, context),
		}
	}
}
