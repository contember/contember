import { DataGridColumnKey } from './column'

export type DataGridHiddenColumnsStateStore = Record<DataGridColumnKey, boolean>

export type DataGridSetIsColumnHidden = (columnKey: DataGridColumnKey, isHidden: boolean) => void
