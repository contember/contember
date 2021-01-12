import { CrudQueryBuilder } from '@contember/client'

export interface SingleColumnOrderBy {
	[fieldName: string]: SingleColumnOrderBy | CrudQueryBuilder.OrderDirection
}
