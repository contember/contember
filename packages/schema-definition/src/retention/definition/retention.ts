import { DecoratorFunction, EntityConstructor } from '../../utils/index.js'
import { Input, Retention as RetentionSchema } from '@contember/schema'
import { retentionStore } from './internal/store.js'

export type RetentionDefinition = {
	/** Policy name. Defaults to `<entity_snake_case>_retention`. */
	readonly name?: string
	/** Sugar for `where: { field: { lt: now() - interval } }` — `field` must be a DateTime column. */
	readonly olderThan?: {
		readonly field: string
		readonly interval: string
	}
	/** Optional Content-API where, ANDed with `olderThan`. */
	readonly where?: Input.Where
	readonly schedule?: RetentionSchema.Schedule
	/** `raw` (default) issues a batched SQL delete; `content` runs the content delete pipeline. */
	readonly strategy?: RetentionSchema.Strategy
	readonly batchSize?: number
	readonly maxPerRun?: number
}

/**
 * Entity decorator: schedules a retention (cleanup) policy that prunes old rows of the
 * decorated entity. Unlike `@AuditLog`, the policy applies to the entity it decorates —
 * no sink reference. Multiple policies per entity are allowed (unique by name).
 */
export const retention =
	<T>(definition: RetentionDefinition): DecoratorFunction<T> => (entity: EntityConstructor<T>, context?: ClassDecoratorContext) => {
		retentionStore.update(entity, it => [...it, definition], context)
	}
