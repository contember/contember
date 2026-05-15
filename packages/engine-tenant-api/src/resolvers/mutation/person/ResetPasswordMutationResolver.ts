import {
	CreatePasswordResetRequestResponse,
	MutationCreateResetPasswordRequestArgs,
	MutationResetPasswordArgs,
	MutationResolvers,
	ResetPasswordResponse,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { TenantResolverContext } from '../../TenantResolverContext'
import {
	CaptchaValidator,
	ConfigurationQuery,
	PasswordResetManager,
	PermissionActions,
	PermissionContextFactory,
	PersonQuery,
	RateLimiter,
} from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { ResponseError, ResponseOk } from '../../../model/utils/Response'

export class ResetPasswordMutationResolver implements MutationResolvers {
	constructor(
		private readonly passwordResetManager: PasswordResetManager,
		private readonly permissionContextFactory: PermissionContextFactory,
		private readonly captchaValidator: CaptchaValidator,
		private readonly rateLimiter: RateLimiter,
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

		const configuration = await context.db.queryHandler.fetch(new ConfigurationQuery())

		const rl = await this.rateLimiter.consume(context.db, 'password_reset_per_ip', context.httpInfo?.ip, configuration)
		if (!rl.ok) {
			return createErrorResponse('RATE_LIMIT_EXCEEDED', `Too many password-reset requests. Retry after ${rl.retryAfterSeconds}s.`)
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

		const person = await context.db.queryHandler.fetch(PersonQuery.byEmail(args.email))
		if (!person) {
			const responseError = new ResponseError('PERSON_NOT_FOUND', `Person with email ${args.email} was not found.`)
			await context.logAuthAction({
				type: 'password_reset_init',
				response: responseError,
				personInput: args.email,
			})

			if (!configuration.login.revealUserExists) {
				// If the user does not exist, we do not want to leak this information
				return { ok: true, errors: [] }
			}

			return createErrorResponse(responseError)
		}

		const permissionContext = await this.permissionContextFactory.create(context.db, {
			id: person.identity_id,
			roles: person.roles,
		})
		await this.passwordResetManager.createPasswordResetRequest(context.db, permissionContext, person, {
			mailVariant: args.options?.mailVariant || undefined,
			project: args.options?.mailProject || undefined,
		})
		await context.logAuthAction({
			type: 'password_reset_init',
			response: new ResponseOk(null),
			personInput: args.email,
			personId: person.id,
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
		await context.logAuthAction({
			type: 'password_reset',
			response: result,
		})
		if (result.ok) {
			return { ok: true, errors: [] }
		}
		return createErrorResponse(result)
	}
}
