import type { EntityAccessor } from '../accessors'
import { useEntityEvent } from './useEntityEvent'

export const useEntityBeforePersist = (listener: EntityAccessor.EntityEventListenerMap['beforePersist']) => {
	useEntityEvent('beforePersist', listener)
}
