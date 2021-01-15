import { DataGridColumns, DataGridFilterArtifactStore, DataGridOrderDirectionStore } from '../base'
import { GridPagingState } from '../paging'

export interface DataGridState {
	paging: GridPagingState

	columns: DataGridColumns
	filterArtifacts: DataGridFilterArtifactStore
	orderDirections: DataGridOrderDirectionStore
}
