import { DatabaseQuery, DatabaseQueryable, Operator, SelectBuilder } from '@contember/database'
import { JSONValue } from '@contember/schema'
import { AuthActionType } from '../../type/AuthLog.js'

export type AuthLogEntryRow = {
	readonly id: string
	readonly created_at: Date
	readonly type: AuthActionType
	readonly success: boolean
	readonly invoked_by_id: string | null
	readonly person_id: string | null
	readonly target_person_id: string | null
	readonly person_input_identifier: string | null
	readonly error_code: string | null
	readonly error_message: string | null
	readonly ip_address: string | null
	readonly user_agent: string | null
	readonly identity_provider_id: string | null
	readonly metadata: JSONValue | null
	readonly event_data: JSONValue | null
}

export type AuthLogFilter = {
	readonly types?: readonly AuthActionType[]
	readonly success?: boolean
	readonly invokedByIdentityId?: string
	readonly personId?: string
	readonly targetPersonId?: string
	readonly personInputIdentifier?: string
	readonly createdAfter?: Date
	readonly createdBefore?: Date
}

const HARD_LIMIT = 500
const DEFAULT_LIMIT = 100

/**
 * Reads `person_auth_log`. Returns one row beyond the requested limit when
 * available so the resolver can set `hasMore` without a separate COUNT(*).
 * Caller (resolver) is responsible for permission gating — this query does
 * not enforce any visibility rules.
 */
export class AuthLogQuery extends DatabaseQuery<readonly AuthLogEntryRow[]> {
	constructor(
		private readonly filter: AuthLogFilter,
		private readonly pagination: { limit?: number; offset?: number },
	) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<readonly AuthLogEntryRow[]> {
		const limit = Math.min(this.pagination.limit ?? DEFAULT_LIMIT, HARD_LIMIT)
		const offset = Math.max(this.pagination.offset ?? 0, 0)

		let qb = SelectBuilder.create<AuthLogEntryRow>()
			.select(['person_auth_log', 'id'])
			.select(['person_auth_log', 'created_at'])
			.select(['person_auth_log', 'type'])
			.select(['person_auth_log', 'success'])
			.select(['person_auth_log', 'invoked_by_id'])
			.select(['person_auth_log', 'person_id'])
			.select(['person_auth_log', 'target_person_id'])
			.select(['person_auth_log', 'person_input_identifier'])
			.select(['person_auth_log', 'error_code'])
			.select(['person_auth_log', 'error_message'])
			.select(['person_auth_log', 'ip_address'])
			.select(['person_auth_log', 'user_agent'])
			.select(['person_auth_log', 'identity_provider_id'])
			.select(['person_auth_log', 'metadata'])
			.select(['person_auth_log', 'event_data'])
			.from('person_auth_log')
			.orderBy(['person_auth_log', 'created_at'], 'desc')
			.orderBy(['person_auth_log', 'id'], 'desc')
			.limit(limit + 1, offset)

		const filter = this.filter
		if (filter.types && filter.types.length > 0) {
			qb = qb.where(it => it.in(['person_auth_log', 'type'], filter.types as string[]))
		}
		if (filter.success !== undefined) {
			qb = qb.where(it => it.compare(['person_auth_log', 'success'], Operator.eq, filter.success!))
		}
		if (filter.invokedByIdentityId !== undefined) {
			qb = qb.where(it => it.compare(['person_auth_log', 'invoked_by_id'], Operator.eq, filter.invokedByIdentityId!))
		}
		if (filter.personId !== undefined) {
			qb = qb.where(it => it.compare(['person_auth_log', 'person_id'], Operator.eq, filter.personId!))
		}
		if (filter.targetPersonId !== undefined) {
			qb = qb.where(it => it.compare(['person_auth_log', 'target_person_id'], Operator.eq, filter.targetPersonId!))
		}
		if (filter.personInputIdentifier !== undefined) {
			qb = qb.where(it => it.compare(['person_auth_log', 'person_input_identifier'], Operator.eq, filter.personInputIdentifier!))
		}
		if (filter.createdAfter !== undefined) {
			qb = qb.where(it => it.compare(['person_auth_log', 'created_at'], Operator.gte, filter.createdAfter!))
		}
		if (filter.createdBefore !== undefined) {
			qb = qb.where(it => it.compare(['person_auth_log', 'created_at'], Operator.lt, filter.createdBefore!))
		}

		return await qb.getResult(db)
	}

	static get hardLimit(): number {
		return HARD_LIMIT
	}

	static get defaultLimit(): number {
		return DEFAULT_LIMIT
	}
}
