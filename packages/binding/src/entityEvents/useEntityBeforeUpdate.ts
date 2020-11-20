import * as React from 'react'
import { useEntityKey, useGetEntityByKey } from '../accessorPropagation'
import { EntityAccessor } from '../accessors'

export const useEntityBeforeUpdate = (listener: EntityAccessor.EntityEventListenerMap['beforeUpdate']) => {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()
	const potentiallyStaleParent = getEntityByKey(entityKey)

	// The identity of this function is guaranteed to be stable
	const stableAddEventListenerReference = potentiallyStaleParent.addEventListener

	React.useEffect(() => {
		// addEventListener returns an unsubscribe function, which we're deliberately re-returning from here.
		return stableAddEventListenerReference('beforeUpdate', listener)
	}, [stableAddEventListenerReference, listener])
}
