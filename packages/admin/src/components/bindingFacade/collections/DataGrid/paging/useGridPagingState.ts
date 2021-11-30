import { useCallback } from 'react'
import { gridPagingReducer } from './gridPagingReducer'
import type { GridPagingState } from './GridPagingState'
import { useSessionStorageState } from '../grid/useStoredState'
import { GridPagingAction } from './GridPagingAction'

export const useGridPagingState = (itemsPerPage: number | null, dataGridKey: string): [GridPagingState, (action: GridPagingAction) => void] => {
	const [paginatorState, setPaginatorState] = useSessionStorageState<GridPagingState>(`${dataGridKey}-page`, val => val ?? {
		pageIndex: 0,
		itemsPerPage,
	})
	return [
		paginatorState,
		useCallback((action: GridPagingAction) => {
			setPaginatorState(val => gridPagingReducer(val, action))
		}, [setPaginatorState]),
	]
}
