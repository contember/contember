import { GridPagingState } from '../paging'
import {
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
