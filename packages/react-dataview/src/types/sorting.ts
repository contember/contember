import { Environment, SugaredOrderBy } from '@contember/binding'
import { OrderBy } from '@contember/react-binding'

export type DataViewOrderDirection = 'asc' | 'desc' | null
export type DataViewSetOrderBy = (setOrderBy: DataViewOrderDirection | 'next', append?: boolean) => void
export type DataViewSetColumnOrderBy = (key: string, columnOrderBy: DataViewOrderDirection | 'next', append?: boolean) => void

export type DataViewSortingMethods = {
	setOrderBy: DataViewSetColumnOrderBy
}

export type DataViewSortingHandler = {}
export type DataViewSortingHandlerRegistry = Record<string, DataViewSortingHandler>

export interface GetNewOrderByOptions {
	environment: Environment
}

export type GetNewOrderBy = (
	newDirection: DataViewOrderDirection,
	options: GetNewOrderByOptions,
) => SugaredOrderBy | undefined

export type DataViewSortingDirections = Record<string, Exclude<DataViewOrderDirection, null>>;

export type DataViewSortingState = {
	directions: DataViewSortingDirections
	orderBy: OrderBy
}

export type DataViewSortingProps = {
	initialSorting?: DataViewSortingDirections
}
