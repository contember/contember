import { DataViewPagingInfo, DataViewPagingMethods, DataViewPagingState } from './paging'
import { DataViewSortingMethods, DataViewSortingState } from './sorting'
import { DataViewFilteringMethods, DataViewFilteringState } from './filtering'
import { QualifiedEntityList } from '@contember/binding'

export type DataViewState = {
	entities: QualifiedEntityList
	key: string
	paging: DataViewPagingState
	sorting: DataViewSortingState
	filtering: DataViewFilteringState
}

export type DataViewInfo = {
	paging: DataViewPagingInfo
}

export type DataViewMethods = {
	paging: DataViewPagingMethods
	sorting: DataViewSortingMethods
	filtering: DataViewFilteringMethods
}
