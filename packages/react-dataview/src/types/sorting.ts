import { Environment, SugaredOrderBy } from '@contember/binding'
import { OrderBy } from '@contember/react-binding'
import { StateStorageOrName } from '@contember/react-utils'

export type DataViewSortingDirection = 'asc' | 'desc' | null
export type DataViewSortingDirectionAction = DataViewSortingDirection | 'next' | 'toggleAsc' | 'toggleDesc' | 'clear'
export type DataViewSetSorting = (setOrderBy: DataViewSortingDirectionAction, append?: boolean) => void
export type DataViewSetColumnSorting = (key: string, columnOrderBy: DataViewSortingDirectionAction, append?: boolean) => void

export type DataViewSortingMethods = {
	setOrderBy: DataViewSetColumnSorting
}

export type DataViewSortingHandler = {}
export type DataViewSortingHandlerRegistry = Record<string, DataViewSortingHandler>

export interface GetNewOrderByOptions {
	environment: Environment
}

export type GetNewOrderBy = (
	newDirection: DataViewSortingDirection,
	options: GetNewOrderByOptions,
) => SugaredOrderBy | undefined

export type DataViewSortingDirections = Record<string, Exclude<DataViewSortingDirection, null>>;

export type DataViewSortingState = {
	directions: DataViewSortingDirections
	orderBy: OrderBy
}

export type DataViewSortingProps = {
	initialSorting?: DataViewSortingDirections
	sortingStateStorage?: StateStorageOrName
}
