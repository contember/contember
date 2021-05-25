import type {
	DesugaredEntityCreationParameters,
	EntityCreationParameters,
	SugarableEntityCreationParameters,
	UnsugarableEntityCreationParameters,
} from './EntityCreationParameters'
import type { DesugaredHasOneRelation, HasOneRelation, SugarableHasOneRelation } from './HasOneRelation'
import type {
	DesugaredQualifiedEntityParameters,
	QualifiedEntityParameters,
	SugarableQualifiedEntityParameters,
	UnsugarableQualifiedEntityParameters,
} from './QualifiedEntityParameters'
import type {
	DesugaredQualifiedSingleEntityParameters,
	QualifiedSingleEntityParameters,
	SugarableQualifiedSingleEntityParameters,
	UnsugarableQualifiedSingleEntityParameters,
} from './QualifiedSingleEntityParameters'
import type {
	DesugaredSingleEntityEventListeners,
	SingleEntityEventListeners,
	SugarableSingleEntityEventListeners,
	UnsugarableSingleEntityEventListeners,
} from './SingleEntityEventListeners'
import type {
	DesugaredSingleEntityParameters,
	SingleEntityParameters,
	SugarableSingleEntityParameters,
	UnsugarableSingleEntityParameters,
} from './SingleEntityParameters'

export interface DesugaredQualifiedSingleEntity
	extends DesugaredQualifiedSingleEntityParameters,
		DesugaredSingleEntityParameters,
		DesugaredQualifiedEntityParameters,
		DesugaredEntityCreationParameters,
		DesugaredSingleEntityEventListeners {
	hasOneRelationPath: DesugaredHasOneRelation[]
}

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
