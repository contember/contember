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
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import type { HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type {
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'


export interface QualifiedEntityList
	extends EntityListParameters,
		QualifiedEntityParameters,
		EntityCreationParameters,
		EntityListEventListeners {
	isCreating: false
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableQualifiedEntityList
	extends SugarableEntityListParameters,
		SugarableQualifiedEntityParameters,
		SugarableEntityCreationParameters,
		SugarableEntityListEventListeners {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableQualifiedEntityList
	extends UnsugarableEntityListParameters,
		UnsugarableQualifiedEntityParameters,
		UnsugarableEntityCreationParameters,
		UnsugarableEntityListEventListeners {
	isCreating?: false
	// Deliberately leaving out UnsugarableHasOneRelation
}

// E.g. Author[age < 123].son.sisters(name = 'Jane')
export interface SugaredQualifiedEntityList extends UnsugarableQualifiedEntityList {
	entities: string | SugarableQualifiedEntityList
}
