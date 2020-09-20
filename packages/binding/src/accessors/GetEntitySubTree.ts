import { Alias, BoxedQualifiedSingleEntity, BoxedUnconstrainedQualifiedSingleEntity } from '../treeParameters'
import { EntityAccessor } from './EntityAccessor'

export interface GetEntitySubTree {
	(alias: Alias): EntityAccessor
	(parameters: BoxedQualifiedSingleEntity | BoxedUnconstrainedQualifiedSingleEntity): EntityAccessor
}
