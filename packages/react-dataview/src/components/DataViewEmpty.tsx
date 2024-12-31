import React, { ReactNode } from 'react'
import { useDataViewEntityListAccessor } from '../contexts'

/**
 * Renders children when the DataView is empty.
 *
 * ## Example
 * ```tsx
 * <DataViewEmpty>
 *     <p>No items found</p>
 * </DataViewEmpty>
 * ```
 */
export const DataViewEmpty = ({ children }: { children: ReactNode }) => {
	const accessor = useDataViewEntityListAccessor()
	return accessor?.length === 0 ? <>{children}</> : null
}
