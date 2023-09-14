import { Filter, OrderBy, QualifiedEntityList } from '@contember/react-binding'
import { DispatchChangePage, GridPagingState } from './paging'
import { DataGridOrderDirectionStore, DataGridSetColumnOrderBy } from './ordering'
import { DataGridFilterArtifactStore, DataGridSetColumnFilter } from './filters'
import { DataGridHiddenColumnsStateStore, DataGridSetIsColumnHidden } from './hiding'
import { DataGridColumns } from './column'
import { DataGridLayout, SetDataGridView } from './layout'

export interface DataGridState<ColumnProps extends {}> {
	/**
	 * input entities, does not include applied filters
	 */
	entities: QualifiedEntityList

	/**
	 * collected columns
	 */
	columns: DataGridColumns<ColumnProps>

	/**
	 * raw grid state
	 */
	paging: GridPagingState
	hiddenColumns: DataGridHiddenColumnsStateStore
	filterArtifacts: DataGridFilterArtifactStore
	orderDirections: DataGridOrderDirectionStore
	layout: DataGridLayout

	/**
	 * constructed structs
	 */
	orderBy: OrderBy
	filter: Filter
}

export interface DataGridStateMethods {
	setIsColumnHidden: DataGridSetIsColumnHidden
	setOrderBy: DataGridSetColumnOrderBy
	setFilter: DataGridSetColumnFilter
	updatePaging: DispatchChangePage
	setLayout: SetDataGridView
}
