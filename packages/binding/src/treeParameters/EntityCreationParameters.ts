import { SetOnCreate, SugaredSetOnCreate } from './SetOnCreate'

export const EntityCreationParametersDefaults = {
	forceCreation: false,
	isNonbearing: false,
} as const

export interface DesugaredEntityCreationParameters {}

export interface EntityCreationParameters {
	forceCreation: boolean
	isNonbearing: boolean
	setOnCreate: SetOnCreate
}

export interface SugarableEntityCreationParameters {}

export interface UnsugarableEntityCreationParameters {
	forceCreation?: boolean
	isNonbearing?: boolean
	setOnCreate?: SugaredSetOnCreate
}
