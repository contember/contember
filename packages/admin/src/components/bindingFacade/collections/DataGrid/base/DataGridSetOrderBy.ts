import type { DataGridColumnKey } from './DataGridColumnKey'
import type { DataGridOrderDirection } from './DataGridOrderDirection'

export type DataGridSetOrderBy = (setOrderBy: DataGridOrderDirection, append?: boolean) => void

export type DataGridSetColumnOrderBy = (columnKey: DataGridColumnKey, columnOrderBy: DataGridOrderDirection, append?: boolean) => void
