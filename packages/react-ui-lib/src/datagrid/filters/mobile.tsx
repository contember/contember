import { useDataViewFilter, useDataViewFilteringState, useDataViewFilterName } from '@contember/react-dataview'
import * as React from 'react'
import { createContext, ReactNode, useContext } from 'react'

export const DataGridShowFiltersContext = createContext(true)

export const DataGridFilterMobileHiding = ({ name,  children }: { name?: string; children: ReactNode }) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	const [,, { isEmpty }] = useDataViewFilter(name)
	const isActive = !isEmpty
	const alwaysShow = useContext(DataGridShowFiltersContext)
	return (
		<div key={name} className={alwaysShow || isActive ? 'contents' : 'hidden sm:contents'}>
			{children}
		</div>
	)
}
