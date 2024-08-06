import type { EntityCreationParameters } from './EntityCreationParameters'
import type { EntityListEventListeners } from './EntityListEventListeners'
import type { EntityListParameters } from './EntityListParameters'
import type { HasOneRelation } from './HasOneRelation'
import type { QualifiedEntityParameters } from './QualifiedEntityParameters'


export interface QualifiedEntityList
	extends EntityListParameters,
	QualifiedEntityParameters,
	EntityCreationParameters,
	EntityListEventListeners {
	isCreating: false
	hasOneRelationPath: HasOneRelation[]
}
