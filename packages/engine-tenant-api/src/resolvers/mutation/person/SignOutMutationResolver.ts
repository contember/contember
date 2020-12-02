import { MutationResolvers, MutationSignOutArgs, SignOutErrorCode, SignOutResponse } from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { QueryHandler } from '@contember/queryable'
import { DatabaseQueryable } from '@contember/database'
import { PermissionActions, ApiKeyManager, PersonQuery } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

export class SignOutMutationResolver implements MutationResolvers {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly queryHandler: QueryHandler<DatabaseQueryable>,
	) {}

	async signOut(parent: any, args: MutationSignOutArgs, context: ResolverContext): Promise<SignOutResponse> {
		const person = await this.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			return createErrorResponse(SignOutErrorCode.NotAPerson, 'Only a person can sign out')
		}

		await context.requireAccess({
			action: PermissionActions.PERSON_SIGN_OUT,
			message: 'You are not allowed to sign out',
		})

		if (args.all) {
			await this.apiKeyManager.disableIdentityApiKeys(context.identity.id)
		} else {
			await this.apiKeyManager.disableApiKey(context.apiKeyId)
		}
		return { ok: true, errors: [] }
	}
}
