import React, { ReactNode } from 'react'
import { useRepeaterSortedEntities } from '../contexts'

/**
 * Renders the children only if the repeater is not empty.
 *
 * #### Example
 * ```tsx
 * <RepeaterNotEmpty>
 *     <p>Items:</p>
 * 	   <RepeaterEachItem>
 * 	       ...
 * 	   </RepeaterEachItem>
 * </RepeaterNotEmpty>
 */
export const RepeaterNotEmpty = ({ children }: { children: ReactNode }) => {
	const entities = useRepeaterSortedEntities()
	if (entities.length === 0) {
		return null
	}
	return <>{children}</>
}
