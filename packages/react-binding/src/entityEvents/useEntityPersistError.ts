import type { EntityAccessor } from '@contember/binding'
import { useEntityEvent } from './useEntityEvent'

export const useEntityPersistError = (listener: EntityAccessor.EntityEventListenerMap['persistError']) => {
	useEntityEvent('persistError', listener)
}
