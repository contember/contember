import type { EntityCreationParameters } from './EntityCreationParameters'
import type { EntityListEventListeners } from './EntityListEventListeners'
import type { EntityListPreferences } from './EntityListPreferences'
import type { HasOneRelation } from './HasOneRelation'
import type { QualifiedEntityParameters } from './QualifiedEntityParameters'

export interface UnconstrainedQualifiedEntityList
	extends QualifiedEntityParameters,
	EntityCreationParameters,
	EntityListEventListeners,
	EntityListPreferences {
	isCreating: true
	isUnpersisted: boolean
	hasOneRelationPath: HasOneRelation[]
}

