import { MutationResolvers, MutationSignUpArgs, SignUpResponse } from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import {
	ApiKeyManager,
	CaptchaValidator,
	ConfigurationQuery,
	EmailVerificationManager,
	NoPassword,
	PasswordHash,
	PasswordPlain,
	PermissionActions,
	PermissionContextFactory,
	PersonQuery,
	RateLimiter,
	SignUpManager,
} from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { UserInputError } from '@contember/graphql-utils'
import { PersonResponseFactory } from '../../responseHelpers/PersonResponseFactory'
import { ResponseError, ResponseOk } from '../../../model/utils/Response'

export class SignUpMutationResolver implements MutationResolvers {
	constructor(
		private readonly signUpManager: SignUpManager,
		private readonly apiKeyManager: ApiKeyManager,
		private readonly captchaValidator: CaptchaValidator,
		private readonly rateLimiter: RateLimiter,
		private readonly emailVerificationManager: EmailVerificationManager,
		private readonly permissionContextFactory: PermissionContextFactory,
	) {}

	async signUp(parent: any, args: MutationSignUpArgs, context: TenantResolverContext): Promise<SignUpResponse> {
		const roles = args.roles ?? []
		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_UP(roles),
			message: 'You are not allowed to sign up',
		})

		const configuration = await context.db.queryHandler.fetch(new ConfigurationQuery(context.db.providers))

		const rl = await this.rateLimiter.consume(context.db, 'sign_up_per_ip', context.httpInfo.ip, configuration)
		if (!rl.ok) {
			return createErrorResponse(
				new ResponseError('RATE_LIMIT_EXCEEDED', `Too many sign-up attempts. Retry after ${rl.retryAfterSeconds}s.`),
			)
		}

		const captchaConfig = this.captchaValidator.extractConfig(configuration)
		if (this.captchaValidator.isEnabled(captchaConfig)) {
			const captcha = await this.captchaValidator.verify({
				config: captchaConfig,
				token: args.captchaToken ?? undefined,
				remoteIp: context.httpInfo.ip,
			})
			if (!captcha.ok) {
				return createErrorResponse('INVALID_CAPTCHA', `Captcha verification failed: ${captcha.reason}`)
			}
		}

		const password = (() => {
			if (args.password) {
				return new PasswordPlain(args.password)
			}
			if (args.passwordHash) {
				if (!args.passwordHash.startsWith('$2b$')) {
					throw new UserInputError('Invalid password hash. Only $2b$ bcrypt hashes are accepted.')
				}
				return new PasswordHash(args.passwordHash)
			}
			return NoPassword
		})()

		const response = await this.signUpManager.signUp(context.db, {
			email: args.email,
			name: args.name ?? undefined,
			password,
			roles,
			config: configuration,
		})

		if (!response.ok) {
			return createErrorResponse(response)
		}
		const result = response.result
		await this.apiKeyManager.disableOneOffApiKey(context.db, context.apiKeyId)

		if (result.emailVerificationRequired) {
			// Re-fetch to get the identity roles needed for the project lookup
			// the verification mail is scoped to.
			const personRow = await context.db.queryHandler.fetch(PersonQuery.byId(result.person.id))
			if (personRow?.email) {
				const permissionContext = await this.permissionContextFactory.create(context.db, {
					id: personRow.identity_id,
					roles: personRow.roles,
				})
				const sent = await this.emailVerificationManager.sendVerificationEmail(context.db, permissionContext, personRow)
				if (sent) {
					await context.logAuthAction({
						type: 'email_verify_init',
						response: new ResponseOk(null),
						personId: personRow.id,
						personInput: personRow.email,
					})
				}
			}
		}

		return {
			ok: true,
			errors: [],
			result: {
				person: PersonResponseFactory.createPersonResponse(result.person),
			},
		}
	}
}
