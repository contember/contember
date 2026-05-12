import { QueryResolvers, SessionInfo } from '../../schema'
import { TenantResolverContext } from '../TenantResolverContext'
import { ApiKeySessionsByIdentityQuery } from '../../model/queries/apiKey'

export class SessionsQueryResolver implements Pick<QueryResolvers, 'mySessions'> {
	async mySessions(parent: unknown, args: unknown, context: TenantResolverContext): Promise<SessionInfo[]> {
		const rows = await context.db.queryHandler.fetch(
			new ApiKeySessionsByIdentityQuery(context.identity.id, { now: context.db.providers.now() }),
		)

		return rows.map(row => ({
			id: row.id,
			createdAt: row.created_at,
			expiresAt: row.expires_at,
			lastUsedAt: row.last_used_at,
			lastIp: row.last_ip,
			lastUserAgent: row.last_user_agent,
			createdIp: row.created_ip,
			createdUserAgent: row.created_user_agent,
			isCurrent: row.id === context.apiKeyId,
		}))
	}
}
