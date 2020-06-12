import { MarkerSubTreeParameters } from '../markers'
import {
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedEntityList,
	BoxedUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { EntityAccessor } from './EntityAccessor'
import { EntityListAccessor } from './EntityListAccessor'

export type SubTreeAccessor = EntityAccessor | EntityListAccessor

export interface GetSubTree {
	(parameters: BoxedQualifiedSingleEntity): EntityAccessor
	(parameters: BoxedQualifiedEntityList): EntityListAccessor
	(parameters: BoxedUnconstrainedQualifiedSingleEntity): EntityAccessor
	(parameters: BoxedUnconstrainedQualifiedEntityList): EntityListAccessor

	// The following overloads are really just combinations of the above combined.
	(parameters: BoxedQualifiedSingleEntity | BoxedUnconstrainedQualifiedSingleEntity): EntityAccessor
	(parameters: BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList): EntityListAccessor
	(parameters: MarkerSubTreeParameters): EntityAccessor | EntityListAccessor
}
