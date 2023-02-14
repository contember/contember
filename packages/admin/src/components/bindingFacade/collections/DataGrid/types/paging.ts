export type GridPagingAction =
	| {
	type: 'goToPage'
	newPageIndex: number
}
	| {
	type: 'setItemsPerPage'
	newItemsPerPage: number | null
}
	| {
	type: 'goToNextPage' | 'goToPreviousPage' | 'goToFirstPage' // | 'goToLastPage'
}

export type DispatchChangePage = (action: GridPagingAction) => void

export type GridPagingState = {
	pageIndex: number
	itemsPerPage: number | null
}

export type GridPagingInfo = {
	totalCount: number | undefined
	pagesCount: number | undefined
}
