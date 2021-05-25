import type { GridPagingAction } from './GridPagingAction'
import type { GridPagingState } from './GridPagingState'

export const gridPagingReducer = (previousState: GridPagingState, action: GridPagingAction): GridPagingState => {
	switch (action.type) {
		case 'goToFirstPage':
			if (previousState.pageIndex === 0) {
				return previousState
			}
			return {
				pageIndex: 0,
				itemsPerPage: previousState.itemsPerPage,
			}
		case 'goToNextPage':
			return {
				pageIndex: previousState.pageIndex + 1,
				itemsPerPage: previousState.itemsPerPage,
			}
		case 'setItemsPerPage':
			if (previousState.itemsPerPage === action.newItemsPerPage) {
				return previousState
			}
			return {
				pageIndex: previousState.pageIndex,
				itemsPerPage: action.newItemsPerPage,
			}
		case 'goToPage':
			if (previousState.pageIndex === action.newPageIndex) {
				return previousState
			}
			return {
				pageIndex: action.newPageIndex,
				itemsPerPage: previousState.itemsPerPage,
			}
		case 'goToPreviousPage':
			if (previousState.pageIndex === 0) {
				return previousState
			}
			return {
				pageIndex: Math.max(0, previousState.pageIndex - 1),
				itemsPerPage: previousState.itemsPerPage,
			}
	}
}
