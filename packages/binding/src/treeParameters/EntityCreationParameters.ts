import { SetOnCreate, SugaredSetOnCreate } from './SetOnCreate'

export const EntityCreationParametersDefaults = {
	// forceCreation: false,
	isNonbearing: false,
} as const

export interface DesugaredEntityCreationParameters {}

/*
It can be somewhat tricky to understand how these parameters actually work. These are all only relevant when *creating
a new entity*, NOT during updates.

First, it is determined if any *bearing* field/relation has anything to be persisted. This occurs:
- For fields if the resolved value (taking defaultValue into account) is not null
- For relations if its children have anything to persist (TODO or if forceCreation is true.)

If at least one of the bearing fields/relations have anything to persist or in the rare case when all fields/relations
are nonbearing, the nonbearing fields/relations are also processed using the same method as described for bearing
fields/relations.

Lastly, setOnCreate comes to play. It doesn't influence whether the entity will be persisted or not but if after
all of the above it is concluded that it will, the values from it are used.
 */
export interface EntityCreationParameters {
	// forceCreation: boolean
	isNonbearing: boolean
	setOnCreate: SetOnCreate
}

export interface SugarableEntityCreationParameters {}

export interface UnsugarableEntityCreationParameters {
	// forceCreation?: boolean
	isNonbearing?: boolean
	setOnCreate?: SugaredSetOnCreate
}
