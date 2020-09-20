import { Alias, BoxedQualifiedSingleEntity, BoxedUnconstrainedQualifiedSingleEntity } from '../treeParameters'
import { EntityAccessor } from './EntityAccessor'

export type GetEntitySubTree = (
	parametersOrAlias: Alias | BoxedQualifiedSingleEntity | BoxedUnconstrainedQualifiedSingleEntity,
) => EntityAccessor
