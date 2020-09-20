import { Alias, BoxedQualifiedEntityList, BoxedUnconstrainedQualifiedEntityList } from '../treeParameters'
import { EntityListAccessor } from './EntityListAccessor'

export interface GetEntityListSubTree {
	(alias: Alias): EntityListAccessor
	(parameters: BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList): EntityListAccessor
}
