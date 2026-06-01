import { MutationResolvers, MutationRevokeSessionArgs, RevokeSessionResponse } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { ApiKey, ApiKeyManager, PermissionActions, PersonQuery } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { ResponseError, ResponseOk } from '../../../model/utils/Response.js'

export class RevokeSessionMutationResolver implements Pick<MutationResolvers, 'revokeSession'> {
	constructor(private readonly apiKeyManager: ApiKeyManager) {}

	async revokeSession(parent: unknown, args: MutationRevokeSessionArgs, context: TenantResolverContext): Promise<RevokeSessionResponse> {
		const person = await context.db.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			const response = new ResponseError('NOT_A_PERSON', 'Only a person can revoke a session')
			await context.logAuthAction({ type: 'session_revoked_by_user', response })
			return createErrorResponse(response.error, response.errorMessage)
		}

		await context.requireAccess({
			action: PermissionActions.PERSON_REVOKE_SESSION,
			message: 'You are not allowed to revoke a session',
		})

		const apiKey = await this.apiKeyManager.findApiKey(context.db, args.sessionId)
		if (!apiKey || apiKey.identity_id !== context.identity.id || apiKey.type !== ApiKey.Type.SESSION) {
			const response = new ResponseError('SESSION_NOT_FOUND', 'Session not found')
			await context.logAuthAction({
				type: 'session_revoked_by_user',
				response,
				personId: person.id,
				metadata: { sessionId: args.sessionId },
			})
			return createErrorResponse(response.error, response.errorMessage)
		}

		await this.apiKeyManager.disableApiKey(context.db, apiKey.id)
		const response = new ResponseOk(null)
		await context.logAuthAction({
			type: 'session_revoked_by_user',
			response,
			personId: person.id,
			metadata: { sessionId: apiKey.id },
		})

		return { ok: true }
	}
}
