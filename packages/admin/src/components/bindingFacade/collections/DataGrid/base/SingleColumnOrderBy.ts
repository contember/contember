import { CrudQueryBuilder } from '@contember/client'
import { DataGridOrderDirection } from './DataGridOrderDirection'

export interface SingleColumnOrderBy {
	[fieldName: string]: SingleColumnOrderBy | CrudQueryBuilder.OrderDirection
}

export type GetNewOrderBy = (newDirection: DataGridOrderDirection) => SingleColumnOrderBy
