import {
	MutationRequestEmailVerificationArgs,
	MutationResolvers,
	MutationVerifyEmailArgs,
	RequestEmailVerificationResponse,
	VerifyEmailResponse,
} from '../../../schema/index.js'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import {
	CaptchaValidator,
	ConfigurationQuery,
	EmailVerificationManager,
	PermissionActions,
	PermissionContextFactory,
	PersonQuery,
	RateLimiter,
} from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { ResponseOk } from '../../../model/utils/Response.js'

export class EmailVerificationMutationResolver implements Pick<MutationResolvers, 'requestEmailVerification' | 'verifyEmail'> {
	constructor(
		private readonly emailVerificationManager: EmailVerificationManager,
		private readonly permissionContextFactory: PermissionContextFactory,
		private readonly captchaValidator: CaptchaValidator,
		private readonly rateLimiter: RateLimiter,
	) {}

	async requestEmailVerification(
		parent: unknown,
		args: MutationRequestEmailVerificationArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<RequestEmailVerificationResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_RESET_PASSWORD,
			message: 'You are not allowed to request e-mail verification',
		})

		const configuration = await context.db.queryHandler.fetch(new ConfigurationQuery(context.db.providers))

		// Per-IP rate limit + captcha mirror createResetPasswordRequest: this is
		// an unauthenticated email-sending endpoint, so gate abuse before the
		// (always-ok) anti-enumeration response below can be used as a mail bomb.
		const rl = await this.rateLimiter.consume(context.db, 'email_verification_per_ip', context.httpInfo.ip, configuration)
		if (!rl.ok) {
			return createErrorResponse('RATE_LIMIT_EXCEEDED', `Too many e-mail verification requests. Retry after ${rl.retryAfterSeconds}s.`)
		}

		const captchaConfig = this.captchaValidator.extractConfig(configuration)
		if (this.captchaValidator.isEnabledFor(captchaConfig, 'emailVerification')) {
			const captcha = await this.captchaValidator.verify({
				config: captchaConfig,
				token: args.captchaToken ?? undefined,
				remoteIp: context.httpInfo.ip,
			})
			if (!captcha.ok) {
				return createErrorResponse('INVALID_CAPTCHA', `Captcha verification failed: ${captcha.reason}`)
			}
		}

		const person = await context.db.queryHandler.fetch(PersonQuery.byEmail(args.email))
		// Always report ok regardless of whether the address exists or is
		// already verified — same anti-enumeration stance as password reset.
		if (person?.email && person.email_verified_at === null) {
			const permissionContext = await this.permissionContextFactory.create(context.db, {
				id: person.identity_id,
				roles: person.roles,
			}, context.permissionContext.authorizator)
			const sent = await this.emailVerificationManager.sendVerificationEmail(context.db, permissionContext, person, {
				mailVariant: args.options?.mailVariant || undefined,
				project: args.options?.mailProject || undefined,
			})
			if (sent) {
				await context.logAuthAction({
					type: 'email_verify_init',
					response: new ResponseOk(null),
					personId: person.id,
					personInput: args.email,
				})
			}
		}
		return { ok: true }
	}

	async verifyEmail(
		parent: unknown,
		args: MutationVerifyEmailArgs,
		context: TenantResolverContext,
		info: GraphQLResolveInfo,
	): Promise<VerifyEmailResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_RESET_PASSWORD,
			message: 'You are not allowed to verify an e-mail address',
		})

		const result = await this.emailVerificationManager.verifyEmail(context.db, args.token)
		await context.logAuthAction({
			type: 'email_verify_complete',
			response: result,
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}
		return { ok: true }
	}
}
