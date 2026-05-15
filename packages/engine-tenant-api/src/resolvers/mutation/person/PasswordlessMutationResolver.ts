import {
	ActivatePasswordlessOtpResponse,
	InitSignInPasswordlessResponse,
	MutationActivatePasswordlessOtpArgs,
	MutationInitSignInPasswordlessArgs,
	MutationResolvers,
	MutationSignInPasswordlessArgs,
	SignInPasswordlessResponse,
} from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { CaptchaValidator, ConfigurationQuery, PermissionActions, RateLimiter } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { SignInResponseFactory } from '../../responseHelpers/SignInResponseFactory'
import { PasswordlessSignInManager } from '../../../model/service/PasswordlessSignInManager'

export class PasswordlessMutationResolver
	implements Pick<MutationResolvers, 'initSignInPasswordless' | 'signInPasswordless' | 'activatePasswordlessOtp'>
{
	constructor(
		private readonly passwordlessSignInManager: PasswordlessSignInManager,
		private readonly signInResponseFactory: SignInResponseFactory,
		private readonly captchaValidator: CaptchaValidator,
		private readonly rateLimiter: RateLimiter,
	) {}

	async initSignInPasswordless(
		parent: any,
		args: MutationInitSignInPasswordlessArgs,
		context: TenantResolverContext,
	): Promise<InitSignInPasswordlessResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_REQUEST_PASSWORDLESS_SIGN_IN,
			message: 'You are not allowed to request passwordless sign in',
		})

		const configuration = await context.db.queryHandler.fetch(new ConfigurationQuery(context.db.providers))

		const rl = await this.rateLimiter.consume(context.db, 'passwordless_init_per_ip', context.httpInfo?.ip, configuration)
		if (!rl.ok) {
			return createErrorResponse('RATE_LIMIT_EXCEEDED', `Too many passwordless sign-in requests. Retry after ${rl.retryAfterSeconds}s.`)
		}

		const captchaConfig = this.captchaValidator.extractConfig(configuration)
		if (this.captchaValidator.isEnabled(captchaConfig)) {
			const captcha = await this.captchaValidator.verify({
				config: captchaConfig,
				token: args.captchaToken ?? undefined,
				remoteIp: context.httpInfo?.ip,
			})
			if (!captcha.ok) {
				return createErrorResponse('INVALID_CAPTCHA', `Captcha verification failed: ${captcha.reason}`)
			}
		}

		const result = await this.passwordlessSignInManager.initSignInPasswordless({
			db: context.db,
			permissionContext: context.permissionContext,
			email: args.email,
			mailVariant: args.options?.mailVariant ?? undefined,
			mailProject: args.options?.mailProject ?? undefined,
		})
		await context.logAuthAction({
			type: 'passwordless_login_init',
			response: result,
		})
		if (!result.ok) {
			if (result.error === 'PERSON_NOT_FOUND' && !configuration.login.revealUserExists) {
				// If the user does not exist, we don't want to reveal that
				return createErrorResponse('PASSWORDLESS_DISABLED', 'Passwordless sign-in is disabled for this person')
			}

			return createErrorResponse(result.error, result.errorMessage)
		}
		return { ok: true, result: result.result }
	}

	async signInPasswordless(parent: any, args: MutationSignInPasswordlessArgs, context: TenantResolverContext): Promise<SignInPasswordlessResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_PASSWORDLESS_SIGN_IN,
			message: 'You are not allowed to sign in using passwordless',
		})
		const signIn = await this.passwordlessSignInManager.signInPasswordless({
			db: context.db,
			requestId: args.requestId,
			token: args.token,
			mfaOtp: args.mfaOtp ?? undefined,
			validationType: args.validationType,
			expiration: args.expiration ?? undefined,
			requestInfo: context.httpInfo,
			trustForwardedInfo: args.options?.trustForwardedClientInfo === true && context.trustForwardedInfo,
		})
		await context.logAuthAction({
			type: 'passwordless_login',
			response: signIn,
		})
		if (!signIn.ok) {
			return createErrorResponse(signIn.error, signIn.errorMessage)
		}
		return {
			ok: true,
			result: await this.signInResponseFactory.createResponse(signIn.result, context),
		}
	}

	async activatePasswordlessOtp(
		parent: any,
		args: MutationActivatePasswordlessOtpArgs,
		context: TenantResolverContext,
	): Promise<ActivatePasswordlessOtpResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_PASSWORDLESS_SIGN_IN,
			message: 'You are not allowed to activate passwordless OTP',
		})
		const result = await this.passwordlessSignInManager.activatePasswordlessOtp({
			db: context.db,
			requestId: args.requestId,
			token: args.token,
			otpHash: args.otpHash,
		})
		await context.logAuthAction({
			type: 'passwordless_login_exchange',
			response: result,
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}
		return { ok: true }
	}
}
