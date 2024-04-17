import { DataViewFilteringArtifacts, DataViewFilteringProps, DataViewPagingProps, DataViewPagingState, DataViewSelectionValues, DataViewSelectionProps, DataViewSortingState } from '../types'

export const dataViewKeyFallback = 'dataview'

export type DataViewStoredStateArgs<V> = [key: [string, string], valueInitializer: (storedValue: V | undefined) => V]

export type DataViewPagingSettingStoredState = Pick<DataViewPagingState, 'itemsPerPage'>
export const getDataViewPagingSettingStorageArgs = ({ dataViewKey, initialItemsPerPage }: {
	dataViewKey?: string
	initialItemsPerPage?: DataViewPagingProps['initialItemsPerPage']
}): DataViewStoredStateArgs<DataViewPagingSettingStoredState> => {
	return [
		[dataViewKey ?? dataViewKeyFallback, 'itemsPerPage'],
		val => val ?? {
			itemsPerPage: initialItemsPerPage ?? 50,
		},
	]
}

export type DataViewCurrentPageStoredState = Pick<DataViewPagingState, 'pageIndex'>
export const getDataViewCurrentPageStorageArgs = ({ dataViewKey }: {
	dataViewKey?: string
}): DataViewStoredStateArgs<DataViewCurrentPageStoredState> => {
	return [
		[dataViewKey ?? dataViewKeyFallback, 'pageIndex'],
		val => val ?? {
			pageIndex: 0,
		},
	]
}

export type DataViewFilteringStoredState = DataViewFilteringArtifacts
export const getDataViewFilteringStorageArgs = ({ dataViewKey, initialFilters }: {
	dataViewKey?: string
	initialFilters?: DataViewFilteringProps['initialFilters']
}): DataViewStoredStateArgs<DataViewFilteringStoredState> => {
	return [
		[dataViewKey ?? dataViewKeyFallback, 'filters'],
		val => typeof initialFilters === 'function' ? initialFilters(val ?? {}) : val ?? initialFilters ?? {},
	]
}

export type DataViewSelectionStoredState = DataViewSelectionValues
export const getDataViewSelectionStorageArgs = ({ dataViewKey, initialSelection, defaultLayout }: {
	dataViewKey?: string
	initialSelection?: DataViewSelectionProps['initialSelection']
	defaultLayout?: string
}): DataViewStoredStateArgs<DataViewSelectionStoredState> => {
	return [
		[dataViewKey ?? dataViewKeyFallback, 'selection'],
		val => {
			const selection = typeof initialSelection === 'function' ? initialSelection(val ?? {}) : val ?? initialSelection ?? {}
			return {
				layout: defaultLayout,
				...selection,
			}
		},
	]
}

export type DataViewSortingStoredState = DataViewSortingState['directions']
export const getDataViewSortingStorageArgs = ({ dataViewKey, initialSorting }: {
	dataViewKey?: string
	initialSorting?: DataViewSortingState['directions']
}): DataViewStoredStateArgs<DataViewSortingStoredState> => {
	return [
		[dataViewKey ?? dataViewKeyFallback, 'sorting'],
		val => val ?? initialSorting ?? {},
	]
}
