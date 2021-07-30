import type { GridPagingState } from '../paging'
import type { DataGridColumns } from './DataGridColumn'
import type { DataGridFilterArtifactStore } from './DataGridFilterArtifactStore'
import type { DataGridHiddenColumnsStateStore } from './DataGridHiddenColumnsStateStore'
import type { DataGridOrderDirectionStore } from './DataGridOrderDirectionStore'

export interface DataGridState {
	paging: GridPagingState

	columns: DataGridColumns
	hiddenColumns: DataGridHiddenColumnsStateStore
	filterArtifacts: DataGridFilterArtifactStore
	orderDirections: DataGridOrderDirectionStore
}
