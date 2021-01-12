import { DataGridColumnKey } from './DataGridColumnKey'
import { DataGridOrderDirection } from './DataGridOrderDirection'
import { SingleColumnOrderBy } from './SingleColumnOrderBy'

export type DataGridSetOrderBy<O extends SingleColumnOrderBy = SingleColumnOrderBy> = (
	setOrderBy: O | DataGridOrderDirection,
) => void

export type DataGridSetColumnOrderBy<O extends SingleColumnOrderBy = SingleColumnOrderBy> = (
	columnKey: DataGridColumnKey,
	columnOrderBy: O | DataGridOrderDirection,
) => void
