import { Filter, Limit, Offset, OrderBy, SugaredFilter, SugaredOrderBy } from './primitives'

export interface DesugaredEntityListParameters {
	filter: Filter | undefined
}

export interface EntityListParameters {
	orderBy: OrderBy | undefined
	offset: Offset | undefined
	limit: Limit | undefined
	filter: Filter | undefined
}

export interface SugarableEntityListParameters {
	filter?: SugaredFilter
}

export interface UnsugarableEntityListParameters {
	orderBy?: SugaredOrderBy
	offset?: Offset
	limit?: Limit
}
