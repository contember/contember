import type {
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import type { HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type {
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'
import type {
	QualifiedSingleEntityParameters,
	SugarableQualifiedSingleEntityParameters,
	UnsugarableQualifiedSingleEntityParameters,
} from './QualifiedSingleEntityParameters'
import type {
	SingleEntityEventListeners,
	SugarableSingleEntityEventListeners,
	UnsugarableSingleEntityEventListeners,
} from './SingleEntityEventListeners'
import type {
	SingleEntityParameters,
	SugarableSingleEntityParameters,
	UnsugarableSingleEntityParameters,
} from './SingleEntityParameters'

export interface QualifiedSingleEntity
	extends QualifiedSingleEntityParameters,
		SingleEntityParameters,
		QualifiedEntityParameters,
		EntityCreationParameters,
		SingleEntityEventListeners {
	isCreating: false
	hasOneRelationPath: HasOneRelation[]
}

export interface SugarableQualifiedSingleEntity
	extends SugarableQualifiedSingleEntityParameters,
		SugarableSingleEntityParameters,
		SugarableQualifiedEntityParameters,
		SugarableEntityCreationParameters,
		SugarableSingleEntityEventListeners {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableQualifiedSingleEntity
	extends UnsugarableQualifiedSingleEntityParameters,
		UnsugarableSingleEntityParameters,
		UnsugarableQualifiedEntityParameters,
		UnsugarableEntityCreationParameters,
		UnsugarableSingleEntityEventListeners {
	isCreating?: false
	// Deliberately leaving out UnsugarableHasOneRelation
}

export interface SugaredQualifiedSingleEntity extends UnsugarableQualifiedSingleEntity {
	entity: string | SugarableQualifiedSingleEntity
}
