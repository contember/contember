import React, { ReactNode } from 'react'
import { useRepeaterSortedEntities } from '../contexts'

/**
 * Renders the children only if the repeater is empty.
 *
 * ## Example
 * ```tsx
 * <RepeaterEmpty>
 *     <p>No items</p>
 * </RepeaterEmpty>
 * ```
 */
export const RepeaterEmpty = ({ children }: { children: ReactNode }) => {
	const entities = useRepeaterSortedEntities()
	if (entities.length > 0) {
		return null
	}
	return <>{children}</>
}
