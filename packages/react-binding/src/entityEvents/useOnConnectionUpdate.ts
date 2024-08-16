import type { EntityAccessor } from '@contember/binding'
import type { FieldName } from '@contember/binding'
import { useEntityEvent } from './useEntityEvent'

export const useOnConnectionUpdate = (
	fieldName: FieldName,
	listener: EntityAccessor.EntityEventListenerMap['connectionUpdate'],
) => {
	useEntityEvent('connectionUpdate', fieldName, listener)
}
