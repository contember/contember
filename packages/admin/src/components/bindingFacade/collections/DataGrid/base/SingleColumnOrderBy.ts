import { Environment } from '@contember/binding'
import { CrudQueryBuilder } from '@contember/client'
import { DataGridOrderDirection } from './DataGridOrderDirection'

export interface SingleColumnOrderBy {
	[fieldName: string]: SingleColumnOrderBy | CrudQueryBuilder.OrderDirection
}

export interface GetNewOrderByOptions {
	environment: Environment
}

export type GetNewOrderBy = (newDirection: DataGridOrderDirection, options: GetNewOrderByOptions) => SingleColumnOrderBy
