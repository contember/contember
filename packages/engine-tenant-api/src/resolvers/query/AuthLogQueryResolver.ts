import { AuthLogPage, QueryAuthLogArgs, QueryResolvers } from '../../schema/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'
import { PermissionActions } from '../../model/index.js'
import { AuthLogQuery } from '../../model/queries/authLog/AuthLogQuery.js'
import { AuthActionType } from '../../model/type/AuthLog.js'

export class AuthLogQueryResolver implements Pick<QueryResolvers, 'authLog'> {
	async authLog(
		parent: unknown,
		args: QueryAuthLogArgs,
		context: TenantResolverContext,
	): Promise<AuthLogPage> {
		await context.requireAccess({
			action: PermissionActions.AUTH_LOG_VIEW,
			message: 'You are not allowed to view the audit log',
		})

		const limit = args.limit ?? undefined
		const offset = args.offset ?? undefined
		const filter = args.filter ?? {}

		const rows = await context.db.queryHandler.fetch(
			new AuthLogQuery(
				{
					types: (filter.types ?? undefined) as readonly AuthActionType[] | undefined,
					success: filter.success ?? undefined,
					invokedByIdentityId: filter.invokedByIdentityId ?? undefined,
					personId: filter.personId ?? undefined,
					targetPersonId: filter.targetPersonId ?? undefined,
					personInputIdentifier: filter.personInputIdentifier ?? undefined,
					createdAfter: filter.createdAfter ?? undefined,
					createdBefore: filter.createdBefore ?? undefined,
				},
				{ limit: limit ?? undefined, offset: offset ?? undefined },
			),
		)

		const effectiveLimit = Math.min(limit ?? AuthLogQuery.defaultLimit, AuthLogQuery.hardLimit)
		const hasMore = rows.length > effectiveLimit
		const visible = hasMore ? rows.slice(0, effectiveLimit) : rows

		return {
			hasMore,
			entries: visible.map(row => ({
				id: row.id,
				createdAt: row.created_at,
				type: row.type,
				success: row.success,
				invokedByIdentityId: row.invoked_by_id,
				personId: row.person_id,
				targetPersonId: row.target_person_id,
				personInputIdentifier: row.person_input_identifier,
				errorCode: row.error_code,
				errorMessage: row.error_message,
				ipAddress: row.ip_address,
				userAgent: row.user_agent,
				identityProviderId: row.identity_provider_id,
				metadata: row.metadata,
				eventData: row.event_data,
			})),
		}
	}
}
