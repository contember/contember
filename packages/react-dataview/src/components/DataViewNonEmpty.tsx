import React, { ReactNode } from 'react'
import { useDataViewEntityListAccessor } from '../contexts'

export const DataViewNonEmpty = ({ children }: { children: ReactNode }) => {
	const accessor = useDataViewEntityListAccessor()
	return !!accessor?.length ? <>{children}</> : null
}
