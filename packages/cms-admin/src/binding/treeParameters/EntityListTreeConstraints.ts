import { Filter, SugaredFilter } from './Filter'
import { Limit } from './Limit'
import { Offset } from './Offset'
import { OrderBy, SugaredOrderBy } from './OrderBy'

export interface EntityListTreeConstraints {
	filter?: Filter
	orderBy?: OrderBy
	offset?: Offset
	limit?: Limit
}

export interface SugaredEntityListTreeConstraints {
	filter?: SugaredFilter
	orderBy?: SugaredOrderBy
	offset?: Offset
	limit?: Limit
}
