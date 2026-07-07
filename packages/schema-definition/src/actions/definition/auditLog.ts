import { DecoratorFunction, EntityConstructor } from '../../utils/index.js'
import { Actions } from '@contember/schema'
import { watch } from './triggers.js'
import { EntityReference } from './targets.js'
import { dateTimeColumn, DisableEventLog, Immutable, Index, intColumn, jsonColumn, stringColumn, uuidColumn } from '../../model/definition/index.js'

export type AuditLogDefinition = {
	/** Watch selection — which fields/relations of the audited aggregate to capture. */
	readonly watch: Actions.SelectionNode | string
	/** Trigger name. Defaults to `<entity_snake_case>_audit`. */
	readonly name?: string
	/** Explicit sink entity — the entity class, or a `() => Entity` thunk for
	 * forward/circular references. The entity must be declared in the model. */
	readonly entity: EntityReference
	/** Write in the audited transaction (atomic) vs. asynchronously via the dispatch queue. */
	readonly synchronous?: boolean
	/** Content relation on the sink entity pointing to the audited root entity. */
	readonly rootRelation?: string
	readonly selection?: Actions.SelectionNode | string
	readonly priority?: number
}

const snakeCase = (value: string): string => value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()

const resolveEntityName = (cls: EntityConstructor, context?: ClassDecoratorContext): string => {
	const name = context?.name ?? cls.name
	if (!name) {
		throw new Error('@AuditLog cannot derive the audited entity name — use a named entity class.')
	}
	return name
}

const resolveRootRelationName = (rootRelation: AuditLogDefinition['rootRelation']): string | undefined => {
	if (rootRelation === undefined) {
		return undefined
	}
	if (rootRelation === '') {
		throw new Error('@AuditLog rootRelation cannot be an empty string.')
	}
	return rootRelation
}

/**
 * Entity decorator: audits an aggregate into an append-only content entity via a
 * built-in `auditLog` target — no webhook. Registers a `withNodes` watch trigger
 * against an explicitly declared sink entity.
 */
export const auditLog = <T>(definition: AuditLogDefinition): DecoratorFunction<T> => (cls, context?) => {
	const entityName = resolveEntityName(cls, context)
	if (!definition.entity) {
		throw new Error('@AuditLog requires an explicit sink `entity`.')
	}
	const triggerName = definition.name ?? `${snakeCase(entityName)}_audit`
	const rootRelationName = resolveRootRelationName(definition.rootRelation)

	watch<T>({
		name: triggerName,
		watch: definition.watch,
		withNodes: true,
		selection: definition.selection,
		priority: definition.priority,
		target: {
			type: 'auditLog',
			entity: definition.entity,
			...(rootRelationName !== undefined ? { rootRelation: rootRelationName } : {}),
			synchronous: definition.synchronous,
		},
	})(cls, context)
}

/**
 * Base class for explicit audit-log sink entities. Extend it when the default
 * convention columns and indexes are enough, then add ACL and any project fields on
 * the concrete entity. The event log is disabled — the audit rows *are* the log, so
 * event-logging their own inserts would only double-record them — and the entity is
 * marked immutable, so the Content API exposes no create/update/delete for it (only the
 * engine writes the rows); reads still follow regular ACL.
 */
export class AuditLogEntity {
	createdAt = dateTimeColumn().notNull().default('now')
	transactionId = uuidColumn().notNull()
	identityId = uuidColumn()
	rootEntity = stringColumn().notNull()
	rootId = stringColumn().notNull()
	trigger = stringColumn()
	eventNo = intColumn().notNull().sequence()
	data = jsonColumn().notNull()
	nodes = jsonColumn()
}

DisableEventLog()(AuditLogEntity)
Immutable()(AuditLogEntity)
Index<AuditLogEntity>({ fields: ['createdAt'] })(AuditLogEntity)
Index<AuditLogEntity>({ fields: ['eventNo'] })(AuditLogEntity)
Index<AuditLogEntity>({ fields: ['rootEntity', 'rootId'] })(AuditLogEntity)
Index<AuditLogEntity>({ fields: ['nodes'], method: 'gin' })(AuditLogEntity)
