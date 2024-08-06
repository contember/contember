import type { EntityListPreferences } from './EntityListPreferences'
import type { Filter, Limit, Offset, OrderBy, SugaredFilter } from './primitives'

export interface EntityListParameters extends EntityListPreferences {
	orderBy: OrderBy | undefined
	offset: Offset | undefined
	limit: Limit | undefined
	filter: Filter | undefined
}
