import type { EntityAccessor } from '@contember/binding'
import { useEntityEvent } from './useEntityEvent'

export const useEntityBeforePersist = (listener: EntityAccessor.EntityEventListenerMap['beforePersist']) => {
	useEntityEvent('beforePersist', listener)
}
