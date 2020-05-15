import * as React from 'react'
import { useParentEntityAccessor } from '../accessorPropagation'
import { EntityAccessor } from '../accessors'

export const useEntityBeforeUpdate = (listener: EntityAccessor.EntityEventListenerMap['beforeUpdate']) => {
	const entity = useParentEntityAccessor()
	const addEventListener = entity.addEventListener // The identity of this function is guaranteed to be stable

	React.useEffect(() => {
		// addEventListener returns an unsubscribe function, which we're deliberately re-returning from here.
		return addEventListener('beforeUpdate', listener)
	}, [addEventListener, listener])
}
