import { DataGridColumnKey } from './column'

export type DataGridHidingState = Record<DataGridColumnKey, boolean>

export type DataGridSetIsColumnHidden = (columnKey: DataGridColumnKey, isHidden: boolean) => void

export type DataGridHidingMethods = {
	setIsColumnHidden: DataGridSetIsColumnHidden
}
