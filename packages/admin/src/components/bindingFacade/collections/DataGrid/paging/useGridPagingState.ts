import { useCallback } from 'react'
import { gridPagingReducer } from './gridPagingReducer'
import type { GridPagingState } from './GridPagingState'
import { useSessionStorageState } from '@contember/react-utils'
import { GridPagingAction } from './GridPagingAction'

export type DispatchChangePage = (action: GridPagingAction) => void
export const useGridPagingState = (itemsPerPage: number | null, dataGridKey: string): [GridPagingState, DispatchChangePage] => {
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
