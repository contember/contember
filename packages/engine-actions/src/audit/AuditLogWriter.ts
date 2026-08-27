import { Client, ConflictActionType, InsertBuilder, QueryBuilder } from '@contember/database'
import { ActionsPayload, JSONValue, Schema } from '@contember/schema'
import { acceptFieldVisitor, isColumn, Providers } from '@contember/schema-utils'

export interface AuditLogRow {
	readonly createdAt: Date
	readonly transactionId: string
	readonly identityId: string | null
	readonly rootEntity: string
	readonly rootId: string
	readonly trigger: string
	readonly data: JSONValue
	readonly nodes: JSONValue
}

export interface AuditLogMeta {
	readonly createdAt: Date
	readonly transactionId: string
	readonly eventId?: string
	readonly identityId: string | null
	readonly ipAddress: string | null
	readonly userAgent: string | null
}

export interface AuditLogWriteOptions {
	readonly primaryValue?: string
	readonly ignorePrimaryConflict?: boolean
	readonly rootRelation?: string
}

/**
 * Maps a `watch` webhook payload to an {@link AuditLogRow}. Pure — shared by the
 * synchronous (persist-time) and asynchronous (dispatch-time) write paths and
 * unit-testable without a database.
 */
export const buildAuditLogRow = (payload: ActionsPayload.WatchEventPayload, meta: AuditLogMeta): AuditLogRow => {
	// Deduplicated flat list of every node touched by the aggregate change — GIN-indexable
	// so "all audit entries touching entity X id Y" is a single lookup.
	const nodes = [
		...new Map(
			payload.events
				.flatMap(it => it.nodes ?? [])
				.map(it => [String(it.id), { id: String(it.id), entity: it.entity }] as const),
		).values(),
	]

	return {
		createdAt: meta.createdAt,
		transactionId: meta.transactionId,
		identityId: meta.identityId,
		rootEntity: payload.entity,
		rootId: String(payload.id),
		trigger: payload.trigger,
		// Round-trip to a plain, deeply-mutable JSON value (the payload is deeply readonly).
		data: JSON.parse(JSON.stringify({
			events: payload.events,
			meta: {
				transactionId: meta.transactionId,
				eventId: meta.eventId,
				identityId: meta.identityId,
				ipAddress: meta.ipAddress,
				userAgent: meta.userAgent,
			},
		})),
		nodes,
	}
}

/**
 * Writes an append-only audit row into a project content entity with a raw
 * `InsertBuilder`, bypassing content ACL by construction (mirrors how
 * `TriggerPayloadPersister` writes `actions_event`). No application role can
 * forge these rows. Column values are filled by convention; any recognised
 * column the entity omits is skipped.
 */
export class AuditLogWriter {
	constructor(
		private readonly providers: Pick<Providers, 'uuid'>,
	) {
	}

	public async write(client: Client, schema: Schema, entityName: string, row: AuditLogRow, options: AuditLogWriteOptions = {}): Promise<void> {
		const entity = schema.model.entities[entityName]
		if (!entity) {
			throw new Error(`Audit-log target entity "${entityName}" not found in the content schema.`)
		}

		const values: QueryBuilder.Values = {
			[entity.primaryColumn]: options.primaryValue ?? this.providers.uuid({ version: schema.settings.content?.uuidVersion }),
		}
		const setColumn = (fieldName: string, value: QueryBuilder.Values[string]) => {
			const field = entity.fields[fieldName]
			if (field && isColumn(field)) {
				values[field.columnName] = value
			}
		}

		setColumn('createdAt', row.createdAt)
		setColumn('transactionId', row.transactionId)
		setColumn('identityId', row.identityId)
		setColumn('rootEntity', row.rootEntity)
		setColumn('rootId', row.rootId)
		setColumn('trigger', row.trigger)
		// Serialize JSON columns explicitly: the pg driver serializes a JS array as a
		// Postgres array literal (not JSON), which corrupts a jsonb `nodes` column — so
		// pass a text value that Postgres parses into jsonb (as EventsRepository does for `log`).
		setColumn('data', JSON.stringify(row.data))
		setColumn('nodes', JSON.stringify(row.nodes))
		if (options.rootRelation !== undefined) {
			const invalidRootRelation = () => {
				throw new Error(`Audit-log root relation ${entity.name}.${options.rootRelation} must be a many-has-one relation.`)
			}
			acceptFieldVisitor(schema.model, entity, options.rootRelation, {
				visitColumn: invalidRootRelation,
				visitManyHasOne: ({ relation }) => {
					values[relation.joiningColumn.columnName] = row.rootId
				},
				visitOneHasOneOwning: invalidRootRelation,
				visitOneHasMany: invalidRootRelation,
				visitOneHasOneInverse: invalidRootRelation,
				visitManyHasManyOwning: invalidRootRelation,
				visitManyHasManyInverse: invalidRootRelation,
			})
		}

		let insert = InsertBuilder.create()
			.into(entity.tableName)
			.values(values)
		if (options.ignorePrimaryConflict) {
			insert = insert.onConflict(ConflictActionType.doNothing, [entity.primaryColumn])
		}
		await insert.execute(client)
	}
}
