import type { EntityAccessor } from '../accessors'
import { useEntityEvent } from './useEntityEvent'

export const useEntityBeforeUpdate = (listener: EntityAccessor.EntityEventListenerMap['beforeUpdate']) => {
	useEntityEvent('beforeUpdate', listener)
}
