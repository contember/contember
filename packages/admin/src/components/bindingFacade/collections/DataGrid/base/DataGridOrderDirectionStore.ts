import type { DataGridColumnKey } from './DataGridColumnKey'
import type { DataGridOrderDirection } from './DataGridOrderDirection'

export type DataGridOrderDirectionStore = Record<DataGridColumnKey, Exclude<DataGridOrderDirection, null>>
