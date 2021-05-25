import type { DataGridColumnKey } from './DataGridColumnKey'
import type { DataGridOrderDirection } from './DataGridOrderDirection'

export type DataGridSetOrderBy = (setOrderBy: DataGridOrderDirection) => void

export type DataGridSetColumnOrderBy = (columnKey: DataGridColumnKey, columnOrderBy: DataGridOrderDirection) => void
