import { Actions } from '@contember/schema'
import { ActionsFactory } from './internal/ActionsFactory'

export * from './triggers'
export * from './targets'


export const createActions = (
	exportedDefinitions: Record<string, any>,
): Actions.Schema => {
	const factory = new ActionsFactory()
	return factory.create(exportedDefinitions)
}
