import { Retention } from '@contember/schema'
import { RetentionFactory } from './internal/RetentionFactory.js'

export * from './retention.js'

export const createRetention = (
	exportedDefinitions: Record<string, any>,
): Retention.Schema => {
	const factory = new RetentionFactory()
	return factory.create(exportedDefinitions)
}
