import type { EntityCreationParameters, UnsugarableEntityCreationParameters } from './EntityCreationParameters'
import type { HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type {
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'
import type {
	QualifiedSingleEntityParameters,
	SugarableQualifiedSingleEntityParameters,
} from './QualifiedSingleEntityParameters'
import type {
	SingleEntityEventListeners,
	UnsugarableSingleEntityEventListeners,
} from './SingleEntityEventListeners'
import type { SingleEntityParameters, SugarableSingleEntityParameters } from './SingleEntityParameters'

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
		SugarableQualifiedEntityParameters {
	hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
}

export interface UnsugarableQualifiedSingleEntity
	extends
		UnsugarableQualifiedEntityParameters,
		UnsugarableEntityCreationParameters,
		UnsugarableSingleEntityEventListeners {
	isCreating?: false
	// Deliberately leaving out UnsugarableHasOneRelation
}

export interface SugaredQualifiedSingleEntity extends UnsugarableQualifiedSingleEntity {
	entity: string | SugarableQualifiedSingleEntity
}
