import { TreeFilter } from '@contember/client'
import * as React from 'react'
import { defaultGetTreeFilters, GetTreeFiltersContext } from './getTreeFiltersContext'

export interface GetTreeFiltersContextProviderProps {
	getTreeFilters: (() => TreeFilter[]) | undefined
	children: React.ReactNode
}

export function GetTreeFiltersProvider(props: GetTreeFiltersContextProviderProps) {
	return (
		<GetTreeFiltersContext.Provider value={props.getTreeFilters || defaultGetTreeFilters}>
			{props.children}
		</GetTreeFiltersContext.Provider>
	)
}
