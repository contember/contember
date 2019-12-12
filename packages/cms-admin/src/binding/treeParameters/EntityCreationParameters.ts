import { SugaredUniqueWhere, UniqueWhere } from './primitives'

export interface DesugaredEntityCreationParameters {}

export interface EntityCreationParameters {
	connectTo: UniqueWhere | undefined
}

export interface SugarableEntityCreationParameters {}

export interface UnsugarableEntityCreationParameters {
	connectTo?: SugaredUniqueWhere
}
