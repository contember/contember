import { BoxedQualifiedSingleEntity, BoxedUnconstrainedQualifiedSingleEntity } from '../treeParameters'
import { EntityAccessor } from './EntityAccessor'

export interface GetEntitySubTree {
	//(customAlias: string): EntityAccessor
	(parameters: BoxedQualifiedSingleEntity | BoxedUnconstrainedQualifiedSingleEntity): EntityAccessor
}
