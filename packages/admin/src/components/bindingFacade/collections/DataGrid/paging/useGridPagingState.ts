import * as React from 'react'
import { gridPagingReducer } from './gridPagingReducer'
import { GridPagingState } from './GridPagingState'

const stateDefaults: GridPagingState = {
	pageIndex: 0,
	itemsPerPage: 25,
}

export const useGridPagingState = ({
	itemsPerPage = stateDefaults.itemsPerPage,
	pageIndex = stateDefaults.pageIndex,
}: Partial<GridPagingState> = stateDefaults) => React.useReducer(gridPagingReducer, { pageIndex, itemsPerPage })
