import {
	DataGridColumns,
	DataGridFilterArtifactStore,
	DataGridHiddenColumnsStateStore,
	DataGridOrderDirectionStore,
} from './index'
import { GridPagingState } from '../paging'

export interface DataGridState {
	paging: GridPagingState

	columns: DataGridColumns
	hiddenColumns: DataGridHiddenColumnsStateStore
	filterArtifacts: DataGridFilterArtifactStore
	orderDirections: DataGridOrderDirectionStore
}
