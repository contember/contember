import type {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import type {
	DesugaredEntityListEventListeners,
	EntityListEventListeners,
	SugarableEntityListEventListeners,
	UnsugarableEntityListEventListeners,
} from './EntityListEventListeners'
import type {
	DesugaredEntityListPreferences,
	EntityListPreferences,
	SugarableEntityListPreferences,
	UnsugarableEntityListPreferences,
} from './EntityListPreferences'
import type { DesugaredHasOneRelation, HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type {
	DesugaredQualifiedEntityParameters,
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'

export interface DesugaredUnconstrainedQualifiedEntityList
	extends DesugaredQualifiedEntityParameters,
		DesugaredEntityCreationParameters,
		DesugaredEntityListEventListeners,
		DesugaredEntityListPreferences {
	hasOneRelationPath: DesugaredHasOneRelation[]
}

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
