import { DataViewPagingInfo, DataViewPagingMethods, DataViewPagingState } from './paging.js'
import { DataViewSortingMethods, DataViewSortingState } from './sorting.js'
import { DataViewFilteringMethods, DataViewFilteringState } from './filtering.js'
import { QualifiedEntityList } from '@contember/react-binding'
import { DataViewSelectionMethods, DataViewSelectionState } from './selection.js'

export type DataViewState = {
	entities: QualifiedEntityList
	key: string
	paging: DataViewPagingState
	sorting: DataViewSortingState
	filtering: DataViewFilteringState
	selection: DataViewSelectionState
}

export type DataViewInfo = {
	paging: DataViewPagingInfo
}

export type DataViewMethods = {
	paging: DataViewPagingMethods
	sorting: DataViewSortingMethods
	filtering: DataViewFilteringMethods
	selection: DataViewSelectionMethods
}
