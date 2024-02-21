import { ReactNode } from 'react'
import { useDataViewEntityListAccessor } from '../contexts'

export const DataViewEmpty = ({ children }: { children: ReactNode }) => {
	const accessor = useDataViewEntityListAccessor()
	return accessor?.length === 0 ? children : null
}
