import type {
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import type {
	EntityListEventListeners,
	SugarableEntityListEventListeners,
	UnsugarableEntityListEventListeners,
} from './EntityListEventListeners'
import type {
	EntityListPreferences,
	SugarableEntityListPreferences,
	UnsugarableEntityListPreferences,
} from './EntityListPreferences'
import type { HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type {
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'

export interface UnconstrainedQualifiedEntityList
	extends QualifiedEntityParameters,
		EntityCreationParameters,
		EntityListEventListeners,
		EntityListPreferences {
	isCreating: true
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableUnconstrainedQualifiedEntityList
	extends SugarableQualifiedEntityParameters,
		SugarableEntityCreationParameters,
		SugarableEntityListEventListeners,
		SugarableEntityListPreferences {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableUnconstrainedQualifiedEntityList
	extends UnsugarableQualifiedEntityParameters,
		UnsugarableEntityCreationParameters,
		UnsugarableEntityListEventListeners,
		UnsugarableEntityListPreferences {
	isCreating: true
	// Deliberately leaving out UnsugarableHasOneRelation
}

// E.g. Author.son.sisters(name = 'Jane')
export interface SugaredUnconstrainedQualifiedEntityList extends UnsugarableUnconstrainedQualifiedEntityList {
	entities: string | SugarableUnconstrainedQualifiedEntityList
}
