import type { Filter, SugaredFilter } from './primitives'

export interface SingleEntityParameters {
	filter: Filter | undefined
}

export interface SugarableSingleEntityParameters {
	filter?: SugaredFilter
}
