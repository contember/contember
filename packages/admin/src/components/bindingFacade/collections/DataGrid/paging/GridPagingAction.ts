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
