import { DataGridColumnKey } from './DataGridColumnKey'
import { DataGridOrderDirection } from './DataGridOrderDirection'

export type DataGridSetOrderBy = (setOrderBy: DataGridOrderDirection) => void

export type DataGridSetColumnOrderBy = (columnKey: DataGridColumnKey, columnOrderBy: DataGridOrderDirection) => void
