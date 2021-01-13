import { Filter } from '@contember/binding'
import { DataGridColumnKey } from './DataGridColumnKey'

export type DataGridSetFilter<F extends Filter = Filter> = (filter: F | undefined) => void

export type DataGridSetColumnFilter<F extends Filter = Filter> = (
	columnKey: DataGridColumnKey,
	columnFilter: F | undefined,
) => void
