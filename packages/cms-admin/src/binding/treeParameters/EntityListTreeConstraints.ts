import { Filter, SugaredFilter } from './Filter'
import { Limit } from './Limit'
import { Offset } from './Offset'
import { OrderBy, SugaredOrderBy } from './OrderBy'
import { EntityTreeSpecification } from './EntityTreeSpecification'

export interface EntityListTreeConstraints extends EntityTreeSpecification {
	filter?: Filter
	orderBy?: OrderBy
	offset?: Offset
	limit?: Limit
}

export interface SugaredEntityListTreeConstraints extends EntityTreeSpecification {
	filter?: SugaredFilter
	orderBy?: SugaredOrderBy
	offset?: Offset
	limit?: Limit
}
