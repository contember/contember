import { Alias, BoxedQualifiedEntityList, BoxedUnconstrainedQualifiedEntityList } from '../treeParameters'
import { EntityListAccessor } from './EntityListAccessor'

export type GetEntityListSubTree = (
	parametersOrAlias: Alias | BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList,
) => EntityListAccessor
