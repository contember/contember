import {
	DataGridColumns,
	DataGridFilterArtifactStore,
	DataGridHiddenColumnsStateStore,
	DataGridOrderDirectionStore,
} from '../base'
import { GridPagingState } from '../paging'

export interface DataGridState {
	paging: GridPagingState

	columns: DataGridColumns
	hiddenColumns: DataGridHiddenColumnsStateStore
	filterArtifacts: DataGridFilterArtifactStore
	orderDirections: DataGridOrderDirectionStore
}
