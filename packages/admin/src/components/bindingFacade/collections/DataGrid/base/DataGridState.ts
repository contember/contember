import type { GridPagingState } from '../paging'
import type {
	DataGridColumns,
	DataGridFilterArtifactStore,
	DataGridHiddenColumnsStateStore,
	DataGridOrderDirectionStore,
} from './index'

export interface DataGridState {
	paging: GridPagingState

	columns: DataGridColumns
	hiddenColumns: DataGridHiddenColumnsStateStore
	filterArtifacts: DataGridFilterArtifactStore
	orderDirections: DataGridOrderDirectionStore
}
