import { useCallback } from 'react'
import { gridPagingReducer } from './gridPagingReducer'
import { useSessionStorageState } from '@contember/react-utils'
import { DispatchChangePage, GridPagingAction, GridPagingState } from '../types'


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
