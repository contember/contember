import { ReactNode } from 'react'
import { useDataViewEntityListAccessor } from '../internal/contexts'

export const DataViewNonEmpty = ({ children }: { children: ReactNode }) => {
	const accessor = useDataViewEntityListAccessor()
	return !!accessor?.length ? children : null
}
