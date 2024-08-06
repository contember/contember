import type { EntityCreationParameters } from './EntityCreationParameters'
import type { HasOneRelation } from './HasOneRelation'
import type { QualifiedEntityParameters } from './QualifiedEntityParameters'
import type { QualifiedSingleEntityParameters } from './QualifiedSingleEntityParameters'
import type { SingleEntityEventListeners } from './SingleEntityEventListeners'
import type { SingleEntityParameters } from './SingleEntityParameters'

export interface QualifiedSingleEntity
	extends QualifiedSingleEntityParameters,
	SingleEntityParameters,
	QualifiedEntityParameters,
	EntityCreationParameters,
	SingleEntityEventListeners {
	isCreating: false
	hasOneRelationPath: HasOneRelation[]
}
