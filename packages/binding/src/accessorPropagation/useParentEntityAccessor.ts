import * as React from 'react'
import { EntityAccessor } from '../accessors'
import { BindingError } from '../BindingError'
import { useEntityAccessorUpdateSubscription } from './useEntityAccessorUpdateSubscription'
import { useEntityKey } from './useEntityKey'
import { useGetEntityByKey } from './useGetEntityByKey'

export const useParentEntityAccessor = (): EntityAccessor => {
	const entityKey = useEntityKey()
	const getEntityByKey = useGetEntityByKey()

	if (entityKey === undefined) {
		throw new BindingError(
			`Trying to use a data bound component outside a correct parent. You likely forgot to use <DataBindingProvider /> ` +
				`or a SubTree.`,
		)
	}

	const getEntityAccessor = React.useCallback(() => getEntityByKey(entityKey), [entityKey, getEntityByKey])
	return useEntityAccessorUpdateSubscription(getEntityAccessor)
}
