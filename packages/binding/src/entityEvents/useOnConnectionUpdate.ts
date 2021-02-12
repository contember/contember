import * as React from 'react'
import { useEntityKey, useGetEntityByKey } from '../accessorPropagation'
import { EntityAccessor } from '../accessors'
import { FieldName } from '../treeParameters'

export const useOnConnectionUpdate = (
	fieldName: FieldName,
	listener: EntityAccessor.EntityEventListenerMap['connectionUpdate'],
) => {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const potentiallyStaleParent = getEntityByKey(entityKey)

	// The identity of this function is guaranteed to be stable
	const stableAddEventListenerReference = potentiallyStaleParent.addEventListener

	React.useEffect(() => {
		// addEventListener returns an unsubscribe function, which we're deliberately re-returning from here.
		return stableAddEventListenerReference('connectionUpdate', fieldName, listener)
	}, [stableAddEventListenerReference, fieldName, listener])
}
