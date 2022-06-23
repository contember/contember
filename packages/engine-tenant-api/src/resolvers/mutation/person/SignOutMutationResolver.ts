import { MutationResolvers, MutationSignOutArgs, SignOutErrorCode, SignOutResponse } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { ApiKeyManager, DatabaseContext, PermissionActions, PersonQuery } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'

export class SignOutMutationResolver implements MutationResolvers {
	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	async signOut(parent: any, args: MutationSignOutArgs, context: TenantResolverContext): Promise<SignOutResponse> {
		const person = await context.db.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			return createErrorResponse(SignOutErrorCode.NotAPerson, 'Only a person can sign out')
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
