import { EntityConnections, SugaredEntityConnections } from './EntityConnections'

export const EntityCreationParametersDefaults = {
	forceCreation: false,
	isNonbearing: false,
} as const

export interface DesugaredEntityCreationParameters {}

export interface EntityCreationParameters {
	connections: EntityConnections
	forceCreation: boolean
	isNonbearing: boolean
}

export interface SugarableEntityCreationParameters {}

export interface UnsugarableEntityCreationParameters {
	connections?: SugaredEntityConnections
	forceCreation?: boolean
	isNonbearing?: boolean
}
