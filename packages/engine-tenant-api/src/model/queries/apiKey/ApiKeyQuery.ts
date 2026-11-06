import { DatabaseQuery, DatabaseQueryable, Literal, Operator, SelectBuilder } from '@contember/database'
import { ApiKey } from '../../type/index.js'
import { computeTokenHash } from '../../utils/index.js'
import { IPostgresInterval } from 'postgres-interval'
import { PROLONG_THROTTLE_MS } from '../../commands/apiKey/ProlongApiKeyCommand.js'

export class ApiKeyByIdQuery extends DatabaseQuery<null | ApiKeyRow> {
	constructor(private readonly apiKeyId: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<null | ApiKeyRow> {
		const rows = await apiKeyBaseQuery
			.where(
				where => where.compare(['api_key', 'id'], Operator.eq, this.apiKeyId),
			)
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}

export class ApiKeyByTokenQuery extends DatabaseQuery<null | ApiKeyRow> {
	constructor(private readonly token: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<null | ApiKeyRow> {
		const tokenHash = computeTokenHash(this.token)
		const rows = await apiKeyBaseQuery
			.where({ token_hash: tokenHash })
			// A key of a disabled person must not authenticate, even one issued after `disablePerson` cascaded.
			.where(where => where.isNull(['person', 'disabled_at']))
			.getResult(db)

		return this.fetchOneOrNull(rows)
	}
}

/** Whether the key or its person is disabled, or the key no longer exists; a narrow re-check on the primary. */
export class ApiKeyRevokedQuery extends DatabaseQuery<boolean> {
	constructor(private readonly apiKeyId: string) {
		super()
	}

	async fetch({ db }: DatabaseQueryable): Promise<boolean> {
		const rows = await SelectBuilder.create<{ is_revoked: boolean }>()
			.select(new Literal('"api_key"."disabled_at" is not null or "person"."disabled_at" is not null'), 'is_revoked')
			.from('api_key')
			.leftJoin('person', 'person', on => on.compareColumns(['person', 'identity_id'], Operator.eq, ['api_key', 'identity_id']))
			.where(where => where.compare(['api_key', 'id'], Operator.eq, this.apiKeyId))
			.getResult(db)

		return rows.length === 0 || rows[0].is_revoked
	}
}

export type ApiKeyRow = {
	readonly id: string
	readonly type: ApiKey.Type
	readonly identity_id: string
	readonly disabled_at: Date | null
	readonly expires_at: Date | null
	readonly expiration: number | null
	readonly roles: string[]
	readonly person_id: string | null
	readonly last_ip: string | null
	readonly last_user_agent: string | null
	readonly last_used_at: Date | null
	readonly trust_forwarded_info: boolean
	readonly issued_at: Date | null
	readonly idle_timeout: IPostgresInterval | null
	readonly max_expires_at: Date | null
	/** Time gates computed on the DB clock (against NOW()) so app/DB skew can't weaken them. */
	readonly is_expired: boolean
	readonly is_max_expired: boolean
	readonly is_idle_expired: boolean
}

const apiKeyBaseQuery = SelectBuilder.create<null | ApiKeyRow>()
	.select(['api_key', 'id'])
	.select(['api_key', 'type'])
	.select(['api_key', 'identity_id'])
	.select(['api_key', 'disabled_at'])
	.select(['api_key', 'expires_at'])
	.select(['identity', 'roles'])
	.select(['api_key', 'expiration'])
	.select(['person', 'id'], 'person_id')
	.select(['api_key', 'last_ip'])
	.select(['api_key', 'last_user_agent'])
	.select(['api_key', 'last_used_at'])
	.select(['api_key', 'trust_forwarded_info'])
	.select(['api_key', 'issued_at'])
	.select(['api_key', 'idle_timeout'])
	.select(['api_key', 'max_expires_at'])
	// A19 time gates on the DB clock — see ApiKeyManager.verifyAndProlong / CLAUDE.md.
	.select(new Literal('"api_key"."expires_at" is not null and "api_key"."expires_at" <= now()'), 'is_expired')
	.select(new Literal('"api_key"."max_expires_at" is not null and "api_key"."max_expires_at" <= now()'), 'is_max_expired')
	.select(
		new Literal(
			'"api_key"."idle_timeout" is not null and "api_key"."last_used_at" is not null'
				+ ' and "api_key"."last_used_at" < now() - "api_key"."idle_timeout" - make_interval(secs => ?)',
			[PROLONG_THROTTLE_MS / 1000],
		),
		'is_idle_expired',
	)
	.from('api_key')
	.join('identity', 'identity', joinClause => joinClause.compareColumns(['api_key', 'identity_id'], Operator.eq, ['identity', 'id']))
	.leftJoin(
		'person',
		'person',
		on =>
			on.compareColumns(
				['person', 'identity_id'],
				Operator.eq,
				['identity', 'id'],
			),
	)
