import { EntityConnections, SugaredEntityConnections } from './EntityConnections'

export interface DesugaredEntityCreationParameters {}

export interface EntityCreationParameters {
	connections: EntityConnections
}

export interface SugarableEntityCreationParameters {}

export interface UnsugarableEntityCreationParameters {
	connections?: SugaredEntityConnections
}
