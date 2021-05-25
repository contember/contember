import type { SugaredUniqueWhere, UniqueWhere } from './primitives'

export interface DesugaredQualifiedSingleEntityParameters {
	where: UniqueWhere
}

export interface QualifiedSingleEntityParameters {
	where: UniqueWhere
}

export interface SugarableQualifiedSingleEntityParameters {
	where: SugaredUniqueWhere
}

export interface UnsugarableQualifiedSingleEntityParameters {}
