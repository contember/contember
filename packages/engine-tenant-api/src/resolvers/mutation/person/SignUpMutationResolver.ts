import { MutationResolvers, MutationSignUpArgs, SignUpResponse } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import {
	ApiKeyManager,
	NoPassword,
	PasswordHash,
	PasswordPlain,
	PermissionActions,
	SignUpManager,
} from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { UserInputError } from '@contember/graphql-utils'

export class SignUpMutationResolver implements MutationResolvers {
	constructor(private readonly signUpManager: SignUpManager, private readonly apiKeyManager: ApiKeyManager) {}

	async signUp(parent: any, args: MutationSignUpArgs, context: TenantResolverContext): Promise<SignUpResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_UP,
			message: 'You are not allowed to sign up',
		})
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

		const response = await this.signUpManager.signUp(context.db, args.email, password, args.roles ?? [])

		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}
		const result = response.result
		await this.apiKeyManager.disableOneOffApiKey(context.db, context.apiKeyId)

		return {
			ok: true,
			errors: [],
			result: {
				person: {
					id: result.person.id,
					otpEnabled: !!result.person.otp_activated_at,
					email: result.person.email,
					identity: {
						id: result.person.identity_id,
						projects: [],
					},
				},
			},
		}
	}
}
