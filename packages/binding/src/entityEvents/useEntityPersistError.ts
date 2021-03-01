import { EntityAccessor } from '../accessors'
import { useEntityEvent } from './useEntityEvent'

export const useEntityPersistError = (listener: EntityAccessor.EntityEventListenerMap['persistError']) => {
	useEntityEvent('persistError', listener)
}
