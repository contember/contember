import { OrderBy } from '@contember/react-binding'
import { StateStorageOrName } from '@contember/react-utils'

export type DataViewSortingDirection = 'asc' | 'desc' | null
export type DataViewSortingDirectionAction = DataViewSortingDirection | 'next' | 'toggleAsc' | 'toggleDesc' | 'clear'
export type DataViewSetColumnSorting = (key: string, columnOrderBy: DataViewSortingDirectionAction, append?: boolean) => void

/**
 * Methods for sorting. Available using {@link useDataViewSortingMethods}.
 */
export type DataViewSortingMethods = {
	setOrderBy: DataViewSetColumnSorting
}


export type DataViewSortingDirections = Record<string, Exclude<DataViewSortingDirection, null>>

/**
 * Current state of sorting.
 * Available using {@link useDataViewSortingState}.
 */
export type DataViewSortingState = {
	/**
	 * Current state of sorting.
	 */
	directions: DataViewSortingDirections
	/**
	 * Resolved order by expression, which can be passed to a query.
	 */
	orderBy: OrderBy
}

export type DataViewSortingProps = {

	/**
	 * Initial sorting state if not available in storage.
	 */
	initialSorting?: DataViewSortingDirections

	/**
	 * Storage for sorting state.
	 * Possible values: 'url', 'session', 'local', 'null' or a custom storage.
	 */
	sortingStateStorage?: StateStorageOrName
}
