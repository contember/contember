import type { Filter, SugaredFilter } from './primitives'

export interface DesugaredSingleEntityParameters {
	filter: Filter | undefined
}

export interface SingleEntityParameters {
	filter: Filter | undefined
}

export interface SugarableSingleEntityParameters {
	filter?: SugaredFilter
}

export interface UnsugarableSingleEntityParameters {}
