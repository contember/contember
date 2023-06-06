import { MutationResolvers, MutationSignOutArgs, SignOutErrorCode, SignOutResponse } from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { ApiKey, ApiKeyManager, PermissionActions, PersonQuery } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

export class SignOutMutationResolver implements MutationResolvers {
	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	async signOut(parent: any, args: MutationSignOutArgs, context: TenantResolverContext): Promise<SignOutResponse> {
		const person = await context.db.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))

		if (!person) {
			return createErrorResponse(SignOutErrorCode.NotAPerson, 'Only a person can sign out')
		}

		const personApiKeyId = await this.apiKeyManager.findApiKey(context.db, context.apiKeyId)

		if (personApiKeyId?.type === ApiKey.Type.PERMANENT) {
			return createErrorResponse(
				SignOutErrorCode.NotPossibleSignOutWithPermanentApiKey, 'Only session API keys can be used for person sign out.',
			)
		}

		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_OUT,
			message: 'You are not allowed to sign out',
		})

		if (args.all) {
			await this.apiKeyManager.disableIdentityApiKeys(context.db, context.identity.id)
		} else {
			await this.apiKeyManager.disableApiKey(context.db, context.apiKeyId)
		}

		return { ok: true, errors: [] }
	}
}
