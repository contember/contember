import { Default } from '@contember/ui'

export type DataGridLayout = Default | 'tiles'
export type SetDataGridView = (layout: DataGridLayout) => void
