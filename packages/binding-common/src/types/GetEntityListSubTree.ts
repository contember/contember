import type { Environment } from '../environment'
import type {
	Alias,
	SugaredQualifiedEntityList,
	SugaredUnconstrainedQualifiedEntityList,
	TreeRootId,
} from '../treeParameters'
import type { EntityListAccessor } from './EntityListAccessor'

export type GetEntityListSubTree = (
	parametersOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
	treeId?: TreeRootId,
	environment?: Environment,
) => EntityListAccessor
