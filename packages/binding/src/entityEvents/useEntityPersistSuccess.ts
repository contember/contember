import type { EntityAccessor } from '../accessors'
import { useEntityEvent } from './useEntityEvent'

export const useEntityPersistSuccess = (listener: EntityAccessor.EntityEventListenerMap['persistSuccess']) => {
	useEntityEvent('persistSuccess', listener)
}
