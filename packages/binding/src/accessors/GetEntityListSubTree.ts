import { BoxedQualifiedEntityList, BoxedUnconstrainedQualifiedEntityList } from '../treeParameters'
import { EntityListAccessor } from './EntityListAccessor'

export interface GetEntityListSubTree {
	//(customAlias: string): EntityListAccessor
	(parameters: BoxedQualifiedEntityList | BoxedUnconstrainedQualifiedEntityList): EntityListAccessor
}
