import type { EntityAccessor } from '@contember/binding'
import { useEntityEvent } from './useEntityEvent'

export const useEntityBeforeUpdate = (listener: EntityAccessor.EntityEventListenerMap['beforeUpdate']) => {
	useEntityEvent('beforeUpdate', listener)
}
