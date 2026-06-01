import type { EntityAccessor } from '@contember/binding'
import { useEntityEvent } from './useEntityEvent.js'

export const useEntityBeforeUpdate = (listener: EntityAccessor.EntityEventListenerMap['beforeUpdate']) => {
	useEntityEvent('beforeUpdate', listener)
}
