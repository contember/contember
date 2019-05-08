import { MutationResolvers, MutationSignOutArgs, SignOutErrorCode, SignOutResponse } from '../../../schema/types'
import ResolverContext from '../../ResolverContext'
import QueryHandler from '../../../../core/query/QueryHandler'
import DbQueryable from '../../../../core/database/DbQueryable'
import Actions from '../../../model/authorization/Actions'
import ApiKeyManager from '../../../model/service/ApiKeyManager'
import PersonQuery from '../../../model/queries/person/PersonQuery'

export default class SignOutMutationResolver implements MutationResolvers {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly queryHandler: QueryHandler<DbQueryable>
	) {}

	async signOut(parent: any, args: MutationSignOutArgs, context: ResolverContext): Promise<SignOutResponse> {
		const person = await this.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			return { ok: false, errors: [{ code: SignOutErrorCode.NotAPerson }] }
		}

		await context.requireAccess({
			action: Actions.PERSON_SIGN_OUT,
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
