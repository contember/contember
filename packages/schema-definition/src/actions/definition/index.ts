import { Actions } from '@contember/schema'
import { ActionsFactory } from './internal/ActionsFactory.js'

export * from './triggers.js'
export * from './targets.js'
export * from './auditLog.js'

export const createActions = (
	exportedDefinitions: Record<string, any>,
): Actions.Schema => {
	const factory = new ActionsFactory()
	return factory.create(exportedDefinitions)
}
