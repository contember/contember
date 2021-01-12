import { DataGridColumnKey } from './DataGridColumnKey'
import { SingleColumnOrderBy } from './SingleColumnOrderBy'

export type DataGridSetOrderBy<O extends SingleColumnOrderBy = SingleColumnOrderBy> = (setOrderBy?: O) => void

export type DataGridSetColumnOrderBy<O extends SingleColumnOrderBy = SingleColumnOrderBy> = (
	columnKey: DataGridColumnKey,
	setOrderBy?: O,
) => void
