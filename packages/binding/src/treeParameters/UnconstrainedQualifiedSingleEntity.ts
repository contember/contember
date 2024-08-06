import type { EntityCreationParameters } from './EntityCreationParameters'
import type { HasOneRelation } from './HasOneRelation'
import type { QualifiedEntityParameters } from './QualifiedEntityParameters'
import type { SingleEntityEventListeners } from './SingleEntityEventListeners'

export interface UnconstrainedQualifiedSingleEntity
	extends QualifiedEntityParameters,
	EntityCreationParameters,
	SingleEntityEventListeners {
	isCreating: true
	isUnpersisted: boolean
	hasOneRelationPath: HasOneRelation[]
}
