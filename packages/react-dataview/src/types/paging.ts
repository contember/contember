export type DataViewPagingMethods = {
	goToPage: (page: number | 'first' | 'next' | 'previous' | 'last') => void
	setItemsPerPage: (newItemsPerPage: number | null) => void
}

export type DataViewPagingState = {
	pageIndex: number
	itemsPerPage: number | null
}

export type DataViewPagingInfo = {
	totalCount: number | undefined
	pagesCount: number | undefined
}

export interface DataViewPagingProps {
	initialItemsPerPage?: number | null
}
