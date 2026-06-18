import { useDataViewFilter, useDataViewFilteringState, useDataViewFilterName } from '@contember/react-dataview'
import * as React from 'react'
import { createContext, ReactNode, useContext } from 'react'

export const DataGridShowFiltersContext = createContext(true)

/**
 * `DataGridFilterMobileHiding` conditionally hides or displays filters based on their state.
 * It ensures that filters are visible when active or when {@link DataGridShowFiltersContext} is set to `true`.
 *
 * ## Example: Basic usage
 * ```tsx
 * <DataGridFilterMobileHiding>
 *   <DataGridTextFilter field="name" label="Name" />
 * </DataGridFilterMobileHiding>
 * ```
 *
 * ## Example: With a specific filter name
 * ```tsx
 * <DataGridFilterMobileHiding name="status">
 *   <DataGridEnumFilter field="status" label="Status" />
 * </DataGridFilterMobileHiding>
 * ```
 */
export const DataGridFilterMobileHiding = ({ name, children }: { name?: string; children: ReactNode }) => {
	name ??= useDataViewFilterName()
	const [, , { isEmpty }] = useDataViewFilter(name)
	const isActive = !isEmpty
	const alwaysShow = useContext(DataGridShowFiltersContext)
	return (
		<div key={name} className={alwaysShow || isActive ? 'contents' : 'hidden sm:contents'}>
			{children}
		</div>
	)
}
