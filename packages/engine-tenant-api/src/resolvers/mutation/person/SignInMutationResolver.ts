import {
	CreateSessionTokenResponse,
	MutationCreateSessionTokenArgs,
	MutationResolvers,
	MutationSignInArgs,
	SignInResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { ConfigurationQuery, PermissionActions, PersonUniqueIdentifier, RateLimiter, SignInManager } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { SignInResponseFactory } from '../../responseHelpers/SignInResponseFactory.js'
import { UserInputError } from '@contember/graphql-utils'
import { NextLoginAttemptQuery } from '../../../model/queries/authLog/NextLoginAttemptQuery.js'
import { ResponseError } from '../../../model/utils/Response.js'

export class SignInMutationResolver implements MutationResolvers {
	constructor(
		private readonly signInManager: SignInManager,
		private readonly signInResponseFactory: SignInResponseFactory,
		private readonly rateLimiter: RateLimiter,
	) {}

	async signIn(parent: any, args: MutationSignInArgs, context: TenantResolverContext): Promise<SignInResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_IN,
			message: 'You are not allowed to sign in',
		})

		const configuration = await context.db.queryHandler.fetch(new ConfigurationQuery(context.db.providers))

		const ipGate = await this.rateLimiter.consume(context.db, 'login_per_ip', context.httpInfo.ip, configuration)
		if (!ipGate.ok) {
			return createErrorResponse(
				new ResponseError('RATE_LIMIT_EXCEEDED', `Too many sign-in attempts from this IP. Retry after ${ipGate.retryAfterSeconds}s.`, {
					retryAfter: ipGate.retryAfterSeconds,
				}),
			)
		}

		const nextAllowedSignIn = await context.db.queryHandler.fetch(new NextLoginAttemptQuery(args.email))
		if (nextAllowedSignIn > new Date()) {
			return createErrorResponse(
				new ResponseError('RATE_LIMIT_EXCEEDED', `Too many attempts, please try again later.`, {
					retryAfter: Math.ceil((nextAllowedSignIn.getTime() - Date.now()) / 1000),
				}),
			)
		}

		const response = await this.signInManager.signIn(
			context.db,
			args.email,
			args.password,
			args.expiration || undefined,
			args.otpToken || undefined,
			context.httpInfo,
			args.options?.trustForwardedClientInfo === true && context.trustForwardedInfo,
			args.backupCode || undefined,
		)
		await context.logAuthAction({
			type: 'login',
			response,
		})
		if (response.ok && response.result.usedBackupCode) {
			await context.logAuthAction({
				type: 'backup_code_used',
				response,
				personId: response.result.person.id,
			})
		}
		if (!response.ok && response.metadata?.emailOtpSent) {
			await context.logAuthAction({
				type: 'email_otp_sent',
				response,
			})
		}
		if (!response.ok && response.metadata?.mfaEnrollmentRequired) {
			await context.logAuthAction({
				type: 'mfa_enrollment_required',
				response,
			})
		}

		if (!response.ok) {
			const { revealUserExists, revealLoginMethod } = configuration.login
			const collapseAll = !revealUserExists
				&& ['NO_PASSWORD_SET', 'PERSON_DISABLED', 'INVALID_PASSWORD', 'UNKNOWN_EMAIL'].includes(response.error)
			const collapseMethodOnly = revealUserExists
				&& !revealLoginMethod
				&& ['NO_PASSWORD_SET', 'INVALID_PASSWORD'].includes(response.error)
			if (collapseAll || collapseMethodOnly) {
				return createErrorResponse('INVALID_CREDENTIALS', 'Invalid credentials')
			}
			// Preserve the additive mfaEnrollment payload on MFA_ENROLLMENT_REQUIRED (A06).
			if (response.error === 'MFA_ENROLLMENT_REQUIRED' && response.metadata?.mfaEnrollment) {
				const error = {
					code: response.error,
					developerMessage: response.errorMessage,
					mfaEnrollment: response.metadata.mfaEnrollment,
				}
				return { ok: false, error, errors: [error] }
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
			async person =>
				await context.requireAccess({
					action: PermissionActions.PERSON_CREATE_SESSION_KEY(person.roles),
					message: 'You are not allowed to create a session key for this person.',
				}),
			context.httpInfo,
			args.options?.trustForwardedClientInfo === true && context.trustForwardedInfo,
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
