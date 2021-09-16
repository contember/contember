import type { SugaredUniqueWhere, UniqueWhere } from './primitives'

export interface QualifiedSingleEntityParameters {
	where: UniqueWhere
}

export interface SugarableQualifiedSingleEntityParameters {
	where: SugaredUniqueWhere
}
