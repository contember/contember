import type { EntityAccessor } from '@contember/binding'
import { useEntityEvent } from './useEntityEvent.js'

export const useEntityPersistSuccess = (listener: EntityAccessor.EntityEventListenerMap['persistSuccess']) => {
	useEntityEvent('persistSuccess', listener)
}
