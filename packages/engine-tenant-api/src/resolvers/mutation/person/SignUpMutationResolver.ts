import { MutationResolvers, MutationSignUpArgs, SignUpResponse } from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PermissionActions, ApiKeyManager, SignUpManager } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

export class SignUpMutationResolver implements MutationResolvers {
	constructor(private readonly signUpManager: SignUpManager, private readonly apiKeyManager: ApiKeyManager) {}

	async signUp(parent: any, args: MutationSignUpArgs, context: TenantResolverContext): Promise<SignUpResponse> {
		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_UP,
			message: 'You are not allowed to sign up',
		})

		const response = await this.signUpManager.signUp(context.db, args.email, args.password, args.roles ?? [])

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
