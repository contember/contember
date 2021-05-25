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
	DesugaredEntityListParameters,
	EntityListParameters,
	SugarableEntityListParameters,
	UnsugarableEntityListParameters,
} from './EntityListParameters'
import type { DesugaredHasOneRelation, HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type {
	DesugaredQualifiedEntityParameters,
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'

export interface DesugaredQualifiedEntityList
	extends DesugaredEntityListParameters,
		DesugaredQualifiedEntityParameters,
		DesugaredEntityCreationParameters,
		DesugaredEntityListEventListeners {
	hasOneRelationPath: DesugaredHasOneRelation[]
}

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
