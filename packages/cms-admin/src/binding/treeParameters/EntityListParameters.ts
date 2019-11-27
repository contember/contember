import { Filter, Limit, Offset, OrderBy, SugaredFilter, SugaredOrderBy } from './primitives'

export interface EntityListParameters {
	filter: Filter | undefined
	orderBy: OrderBy | undefined
	offset: Offset | undefined
	limit: Limit | undefined
}

export interface SugarableEntityListParameters {
	filter?: SugaredFilter
}

export interface UnsugarableEntityListParameters {
	orderBy?: SugaredOrderBy
	offset?: Offset
	limit?: Limit
}
