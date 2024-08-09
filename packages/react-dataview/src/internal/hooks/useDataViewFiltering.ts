import { useCallback, useMemo } from 'react'
import { useStoredState } from '@contember/react-utils'
import { DataViewFilteringMethods, DataViewFilteringProps, DataViewFilteringState } from '../../types'
import { useDataViewResolvedFilters } from './useDataViewResolvedFilters'
import { QualifiedEntityList } from '@contember/react-binding'
import { DataViewFilteringStoredState, getDataViewFilteringStorageArgs } from '../stateStorage'

export type UseDataViewFilteringArgs =
	& {
		dataViewKey?: string
		resetPage: () => void
		entities: QualifiedEntityList
	}
	& DataViewFilteringProps


export type UseDataViewFilteringResult = {
	state: DataViewFilteringState
	methods: DataViewFilteringMethods
}

const emptyObject = {}
export const useDataViewFiltering = ({ dataViewKey, initialFilters, filteringStateStorage, filterTypes = emptyObject, resetPage, entities }: UseDataViewFilteringArgs): UseDataViewFilteringResult => {
	const [filters, setFilters] = useStoredState<DataViewFilteringStoredState>(
		filteringStateStorage ?? 'null',
		...getDataViewFilteringStorageArgs({
			dataViewKey,
			initialFilters,
		}),
	)
	const resolvedFilters = useDataViewResolvedFilters({
		entities,
		filterTypes,
		filters,
	})

	const setFilter = useCallback<DataViewFilteringMethods['setFilter']>((key, columnFilter) => {
		const column = filterTypes?.[key]
		if (column === undefined) {
			throw new Error(`Unknown filter ${key}`)
		}
		let didBailOut = false

		setFilters(filters => {
			const { [key]: existingValue, ...otherFilters } = filters
			const filterResolved = typeof columnFilter === 'function' ? columnFilter(existingValue as any) : columnFilter

			if (existingValue === filterResolved) {
				didBailOut = true
				return filters
			}
			if (filterResolved === undefined) {
				return otherFilters
			} else {
				return { ...filters, [key]: filterResolved }
			}
		})
		if (!didBailOut) {
			resetPage()
		}
	}, [filterTypes, resetPage, setFilters])

	return {
		state: useMemo(() => ({
			artifact: filters,
			filter: resolvedFilters,
			filterTypes,
		}), [filters, resolvedFilters, filterTypes]),
		methods: useMemo(() => ({
			setFilter,
		}),
		[setFilter],
		),
	}
}
