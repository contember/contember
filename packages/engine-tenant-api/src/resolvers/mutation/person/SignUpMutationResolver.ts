import { MutationResolvers, MutationSignUpArgs, SignUpResponse } from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import {
	ApiKeyManager,
	NoPassword,
	PasswordHash,
	PasswordPlain,
	PermissionActions,
	SignUpManager,
} from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { UserInputError } from '@contember/graphql-utils'
import { PersonResponseFactory } from '../../responseHelpers/PersonResponseFactory'

export class SignUpMutationResolver implements MutationResolvers {
	constructor(private readonly signUpManager: SignUpManager, private readonly apiKeyManager: ApiKeyManager) {}

	async signUp(parent: any, args: MutationSignUpArgs, context: TenantResolverContext): Promise<SignUpResponse> {
		const roles = args.roles ?? []
		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_UP(roles),
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

		const response = await this.signUpManager.signUp(context.db, {
			email: args.email,
			name: args.name ?? undefined,
			password,
			roles,
		})

		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}
		const result = response.result
		await this.apiKeyManager.disableOneOffApiKey(context.db, context.apiKeyId)

		return {
			ok: true,
			errors: [],
			result: {
				person: PersonResponseFactory.createPersonResponse(result.person),
			},
		}
	}
}
