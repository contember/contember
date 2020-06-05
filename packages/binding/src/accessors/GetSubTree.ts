import {
	MarkerSubTreeParameters,
	TaggedQualifiedEntityList,
	TaggedQualifiedSingleEntity,
	TaggedUnconstrainedQualifiedEntityList,
	TaggedUnconstrainedQualifiedSingleEntity,
} from '../markers'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { EntityListAccessor } from './EntityListAccessor'

export type SubTreeAccessor = EntityAccessor | EntityForRemovalAccessor | EntityListAccessor

export interface GetSubTree {
	(parameters: TaggedQualifiedSingleEntity): EntityAccessor | EntityForRemovalAccessor
	(parameters: TaggedQualifiedEntityList): EntityListAccessor
	(parameters: TaggedUnconstrainedQualifiedSingleEntity): EntityAccessor
	(parameters: TaggedUnconstrainedQualifiedEntityList): EntityListAccessor

	// The following overloads are really just combinations of the above combined.
	(parameters: TaggedQualifiedSingleEntity | TaggedUnconstrainedQualifiedSingleEntity):
		| EntityAccessor
		| EntityForRemovalAccessor
	(parameters: TaggedQualifiedEntityList | TaggedUnconstrainedQualifiedEntityList): EntityListAccessor
	(parameters: MarkerSubTreeParameters): EntityAccessor | EntityForRemovalAccessor | EntityListAccessor
}
