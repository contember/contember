import React, { ReactNode } from 'react'
import { useDataViewEntityListAccessor } from '../contexts.js'

/**
 * Renders children when the DataView is not empty.
 */
export const DataViewNonEmpty = ({ children }: { children: ReactNode }) => {
	const accessor = useDataViewEntityListAccessor()
	return accessor?.length ? <>{children}</> : null
}
