import {
	TaggedQualifiedEntityList,
	TaggedQualifiedSingleEntity,
	TaggedUnconstrainedQualifiedEntityList,
	TaggedUnconstrainedQualifiedSingleEntity,
} from '../markers'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { EntityListAccessor } from './EntityListAccessor'

export interface GetSubTree {
	(parameters: TaggedQualifiedSingleEntity): EntityAccessor | EntityForRemovalAccessor | null
	(parameters: TaggedQualifiedEntityList): EntityListAccessor
	(parameters: TaggedUnconstrainedQualifiedSingleEntity): EntityAccessor
	(parameters: TaggedUnconstrainedQualifiedEntityList): EntityListAccessor
}
