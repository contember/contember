import { Filter, OrderBy, QualifiedEntityList } from '@contember/react-binding'
import type { DispatchChangePage, GridPagingState } from '../paging'
import type { DataGridColumns } from './DataGridColumn'
import type { DataGridFilterArtifactStore } from './DataGridFilterArtifactStore'
import type { DataGridHiddenColumnsStateStore } from './DataGridHiddenColumnsStateStore'
import { DataGridLayout, SetDataGridView } from './DataGridLayout'
import type { DataGridOrderDirectionStore } from './DataGridOrderDirectionStore'
import { DataGridSetColumnFilter } from './DataGridSetFilter'
import { DataGridSetIsColumnHidden } from './DataGridSetIsColumnHidden'
import { DataGridSetColumnOrderBy } from './DataGridSetOrderBy'

export interface DataGridState {
	/**
	 * input entities, does not include applied filters
	 */
	entities: QualifiedEntityList

	/**
	 * collected columns
	 */
	columns: DataGridColumns

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
