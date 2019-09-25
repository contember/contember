import { MutationResolvers, MutationSignUpArgs, SignUpResponse } from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ApiKeyManager, SignUpManager } from '../../../model'

export class SignUpMutationResolver implements MutationResolvers {
	constructor(private readonly signUpManager: SignUpManager, private readonly apiKeyManager: ApiKeyManager) {}

	async signUp(parent: any, args: MutationSignUpArgs, context: ResolverContext): Promise<SignUpResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_UP,
			message: 'You are not allowed to sign up',
		})

		const result = await this.signUpManager.signUp(args.email, args.password)

		if (!result.ok) {
			return {
				ok: false,
				errors: result.errors.map(errorCode => ({ code: errorCode })),
			}
		}

		await this.apiKeyManager.disableOneOffApiKey(context.apiKeyId)

		return {
			ok: true,
			errors: [],
			result: {
				person: {
					id: result.person.id,
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
