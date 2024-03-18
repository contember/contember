import { useCallback, useMemo } from 'react'
import { useStoredState } from '@contember/react-utils'
import { DataViewSortingMethods, DataViewSortingProps, DataViewSortingState } from '../../types'
import { cycleOrderDirection } from '../helpers/cycleOrderDirection'
import { OrderBy, QueryLanguage, useEnvironment } from '@contember/react-binding'

export type UseDataViewSortingArgs =
	& {
		dataViewKey?: string
		resetPage: () => void
	}
	& DataViewSortingProps

export type UseDataViewSortingResult = {
	state: DataViewSortingState
	methods: DataViewSortingMethods
}

export const useDataViewSorting = ({ dataViewKey, initialSorting, sortingStateStorage, resetPage }: UseDataViewSortingArgs): UseDataViewSortingResult => {
	const [directions, setDirections] = useStoredState<DataViewSortingState['directions']>(
		sortingStateStorage ?? 'session',
		[dataViewKey ?? 'dataview', 'orderBy'],
		val => val ?? initialSorting ?? {},
	)
	const environment = useEnvironment()

	const orderBy = useMemo((): OrderBy => {
		return Object.entries(directions).flatMap(([field, direction]) => {
			return QueryLanguage.desugarOrderBy(`${field} ${direction}`, environment)
		})
	}, [environment, directions])

	const setOrderBy = useCallback<DataViewSortingMethods['setOrderBy']>((columnKey, columnOrderBy, append) => {
		let didBailOut = false

		setDirections(orderBys => {
			const existingValue = orderBys[columnKey] ?? null

			if (existingValue === columnOrderBy) {
				didBailOut = true
				return orderBys
			}
			const resolvedValue = (() => {
				switch (columnOrderBy) {
					case 'next':
						return cycleOrderDirection(existingValue)
					case 'toggleAsc':
						return existingValue === 'asc' ? null : 'asc'
					case 'toggleDesc':
						return existingValue === 'desc' ? null : 'desc'
					case 'clear':
						return null
					default:
						return columnOrderBy
				}
			})()
			if (resolvedValue === null) {
				const { [columnKey]: _, ...rest } = orderBys
				return rest
			}
			return append ? { ...orderBys, [columnKey]: resolvedValue } : { [columnKey]: resolvedValue }
		})
		if (!didBailOut) {
			resetPage()
		}
	}, [resetPage, setDirections])

	return {
		state: useMemo(() => {
			return {
				directions,
				orderBy,
			}
		}, [directions, orderBy]),
		methods: useMemo(() => {
			return {
				setOrderBy,
			}
		}, [setOrderBy]),
	}
}
