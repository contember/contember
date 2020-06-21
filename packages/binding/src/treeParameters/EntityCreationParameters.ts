import { EntityConnections, SugaredEntityConnections } from './EntityConnections'

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
