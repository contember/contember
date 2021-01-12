import { DataGridColumns, DataGridFilters, DataGridOrderBys } from '../base'
import { GridPagingState } from '../paging'

export interface DataGridState {
	paging: GridPagingState

	columns: DataGridColumns
	filters: DataGridFilters
	orderBys: DataGridOrderBys
}
