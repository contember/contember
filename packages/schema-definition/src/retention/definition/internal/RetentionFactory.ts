import { EntityConstructor, filterEntityDefinition, isEntityConstructor } from '../../../utils/index.js'
import { Retention } from '@contember/schema'
import { RetentionDefinition } from '../retention.js'
import { retentionStore } from './store.js'
import { AuditLogRetentionDefinition, auditLogRetentionStore } from '../../../actions/definition/internal/auditLogRetentionStore.js'
import { EntityReference } from '../../../actions/definition/targets.js'

const snakeCase = (value: string): string => value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()

export class RetentionFactory {
	public create(exportedDefinitions: Record<string, any>): Retention.Schema {
		const entityLikeDefinition = filterEntityDefinition(exportedDefinitions)
		const policies: Record<string, Retention.Policy> = {}
		const add = (name: string, policy: Retention.Policy) => {
			if (policies[name]) {
				throw `Duplicate retention policy name ${name}.`
			}
			policies[name] = policy
		}

		for (const [entityName, entity] of entityLikeDefinition) {
			for (const definition of retentionStore.get(entity)) {
				const name = definition.name ?? `${snakeCase(entityName)}_retention`
				add(name, this.createPolicy(name, entityName, definition))
			}
		}

		// `@AuditLog({ retention })` sugar: the policy targets the audit sink, resolved from its class ref
		// here (deferred, like the audit target's `entity`), keyed by the audited entity in the store.
		const entityNameByConstructor = new Map<EntityConstructor, string>(
			entityLikeDefinition.map(([name, entity]) => [entity, name]),
		)
		const resolveSinkName = (ref: EntityReference): string => {
			const entity = isEntityConstructor(ref) ? ref : ref()
			const name = entityNameByConstructor.get(entity)
			if (!name) {
				throw `Audit-log retention references entity ${entity?.name ?? String(entity)} which is not a registered entity. Have you exported it?`
			}
			return name
		}
		for (const [, entity] of entityLikeDefinition) {
			for (const intent of auditLogRetentionStore.get(entity)) {
				const sinkName = resolveSinkName(intent.sink)
				const name = intent.retention.name ?? `${snakeCase(sinkName)}_retention`
				add(
					name,
					this.createPolicy(name, sinkName, {
						...intent.retention,
						olderThan: intent.retention.olderThan !== undefined
							? { field: intent.retention.olderThan.field ?? 'createdAt', interval: intent.retention.olderThan.interval }
							: undefined,
					}),
				)
			}
		}

		return { policies }
	}

	private createPolicy(name: string, entity: string, definition: RetentionDefinition | AuditLogRetentionDefinition): Retention.Policy {
		return {
			name,
			entity,
			strategy: definition.strategy ?? 'raw',
			...(definition.olderThan !== undefined && definition.olderThan.field !== undefined
				? { olderThan: { field: definition.olderThan.field, interval: definition.olderThan.interval } }
				: {}),
			...(definition.where !== undefined ? { where: definition.where } : {}),
			...(definition.schedule !== undefined ? { schedule: definition.schedule } : {}),
			...(definition.batchSize !== undefined ? { batchSize: definition.batchSize } : {}),
			...(definition.maxPerRun !== undefined ? { maxPerRun: definition.maxPerRun } : {}),
		}
	}
}
