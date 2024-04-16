import { QueryLanguage, SugaredQualifiedEntityList } from '@contember/binding'
import { DataViewInfo, DataViewMethods, DataViewState } from '../types/dataview'
import { useDataViewKey } from './useDataViewKey'
import { useCallback, useMemo, useRef } from 'react'
import { useEnvironment } from '@contember/react-binding'
import { useDataViewFiltering } from '../internal/hooks/useDataViewFiltering'
import { DataViewFilteringProps, DataViewPagingProps, DataViewSelectionProps, DataViewSortingProps } from '../types'
import { useDataViewSorting } from '../internal/hooks/useDataViewSorting'
import { useDataViewPaging } from '../internal/hooks/useDataViewPaging'
import { useDataViewSelection } from '../internal/hooks/useDataViewSelection'

export type UseDataViewArgs =
	& {
		dataViewKey?: string
		entities: SugaredQualifiedEntityList['entities']
	}
	& DataViewFilteringProps
	& DataViewSortingProps
	& DataViewPagingProps
	& DataViewSelectionProps

export type UseDataViewResult = {
	state: DataViewState
	info: DataViewInfo
	methods: DataViewMethods
}

export const useDataView = (args: UseDataViewArgs): UseDataViewResult => {

	const key = useDataViewKey(args)

	const environment = useEnvironment()
	const entities = useMemo(() =>
			QueryLanguage.desugarQualifiedEntityList({ entities: args.entities }, environment),
		[environment, args.entities],
	)

	const resetPageRef = useRef<() => void>(() => {
	})
	const resetPage = useCallback(() => {
		resetPageRef.current()
	}, [])

	const { state: filteringState, methods: filteringMethods } = useDataViewFiltering({
		dataViewKey: key,
		filterTypes: args.filterTypes,
		initialFilters: args.initialFilters,
		filteringStateStorage: args.filteringStateStorage,
		entities,
		resetPage,
	})

	const { state: sortingState, methods: sortingMethods } = useDataViewSorting({
		dataViewKey: key,
		initialSorting: args.initialSorting,
		sortingStateStorage: args.sortingStateStorage,
		resetPage,
	})

	const { state: pagingState, methods: pagingMethods, info: pagingInfo } = useDataViewPaging({
		dataViewKey: key,
		initialItemsPerPage: args.initialItemsPerPage,
		currentPageStateStorage: args.currentPageStateStorage,
		pagingSettingsStorage: args.pagingSettingsStorage,
		entities,
		filter: filteringState.filter,
	})

	const { state: selectionState, methods: selectionMethods } = useDataViewSelection({
		dataViewKey: key,
		resetPage,
		initialSelection: args.initialSelection,
		selectionStateStorage: args.selectionStateStorage,
	})

	resetPageRef.current = () => {
		pagingMethods.goToPage(0)
	}

	const state = useMemo(() => ({
		key,
		entities,
		filtering: filteringState,
		sorting: sortingState,
		paging: pagingState,
		selection: selectionState,
	}), [key, entities, filteringState, sortingState, pagingState, selectionState])

	const methods = useMemo(() => ({
		filtering: filteringMethods,
		sorting: sortingMethods,
		paging: pagingMethods,
		selection: selectionMethods,
	}), [filteringMethods, sortingMethods, pagingMethods, selectionMethods])

	const info = useMemo(() => ({
		paging: pagingInfo,
	}), [pagingInfo])

	return useMemo(() => ({
		state,
		methods,
		info,
	}), [state, methods, info])
}
