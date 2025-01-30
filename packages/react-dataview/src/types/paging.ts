import { StateStorageOrName } from '@contember/react-utils'

/**
 * Methods for paging. Available using {@link useDataViewPagingMethods}.
 */
export type DataViewPagingMethods = {

	/**
	 * Refresh the total count of items.
	 */
	refreshTotalCount: () => void

	/**
	 * Go to a specific page.
	 * Can be 'first', 'next', 'previous', 'last' or a number (0-based).
	 */
	goToPage: (page: number | 'first' | 'next' | 'previous' | 'last') => void

	/**
	 * Change the number of items per page.
	 */
	setItemsPerPage: (newItemsPerPage: number | null) => void
}

/**
 * Current state of paging. Available using {@link useDataViewPagingState}.
 */
export type DataViewPagingState = {
	/**
	 * Current page index (0-based).
	 */
	pageIndex: number
	/**
	 * Number of items per page.
	 */
	itemsPerPage: number | null
}

/**
 * Information about paging.
 */
export type DataViewPagingInfo = {
	/**
	 * Total number of items.
	 */
	totalCount: number | undefined
	/**
	 * Total number of pages.
	 */
	pagesCount: number | undefined
}

export interface DataViewPagingProps {
	/**
	 * Initial items per page if not available in storage.
	 * @defaultValue 50
	 */
	initialItemsPerPage?: number | null
	/**
	 * Storage for current page state.
	 * Possible values: 'url', 'session', 'local', 'null' or a custom storage.
	 */
	currentPageStateStorage?: StateStorageOrName
	/**
	 * Storage for paging settings (items per page).
	 * Possible values: 'url', 'session', 'local', 'null' or a custom storage.
	 */
	pagingSettingsStorage?: StateStorageOrName
}
