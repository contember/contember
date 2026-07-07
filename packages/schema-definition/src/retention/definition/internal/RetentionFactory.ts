import { filterEntityDefinition } from '../../../utils/index.js'
import { Retention } from '@contember/schema'
import { RetentionDefinition } from '../retention.js'
import { retentionStore } from './store.js'

const snakeCase = (value: string): string => value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()

export class RetentionFactory {
	public create(exportedDefinitions: Record<string, any>): Retention.Schema {
		const entityLikeDefinition = filterEntityDefinition(exportedDefinitions)
		const policies: Record<string, Retention.Policy> = {}
		for (const [entityName, entity] of entityLikeDefinition) {
			for (const definition of retentionStore.get(entity)) {
				const name = definition.name ?? `${snakeCase(entityName)}_retention`
				if (policies[name]) {
					throw `Duplicate retention policy name ${name}.`
				}
				policies[name] = this.createPolicy(name, entityName, definition)
			}
		}
		return { policies }
	}

	private createPolicy(name: string, entity: string, definition: RetentionDefinition): Retention.Policy {
		return {
			name,
			entity,
			strategy: definition.strategy ?? 'raw',
			...(definition.olderThan !== undefined ? { olderThan: definition.olderThan } : {}),
			...(definition.where !== undefined ? { where: definition.where } : {}),
			...(definition.schedule !== undefined ? { schedule: definition.schedule } : {}),
			...(definition.batchSize !== undefined ? { batchSize: definition.batchSize } : {}),
			...(definition.maxPerRun !== undefined ? { maxPerRun: definition.maxPerRun } : {}),
		}
	}
}
