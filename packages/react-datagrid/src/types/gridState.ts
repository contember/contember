import { DataGridHidingMethods, DataGridHidingState } from './hiding'
import { DataGridColumns } from './column'
import { DataGridLayoutMethods, DataGridLayoutState } from './layout'
import { DataViewMethods, DataViewState } from '@contember/react-dataview'

export type DataGridState<ColumnProps extends {}> =
	& DataViewState
	& {
		columns: DataGridColumns<ColumnProps>
		hiddenColumns: DataGridHidingState
		layout: DataGridLayoutState
	}

export type DataGridMethods =
	& DataViewMethods
	& {
		hiding: DataGridHidingMethods
		layout: DataGridLayoutMethods
	}
