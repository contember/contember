import type { Environment } from '../environment/index.js'
import type { Alias, SugaredQualifiedEntityList, SugaredUnconstrainedQualifiedEntityList, TreeRootId } from '../treeParameters/index.js'
import type { EntityListAccessor } from './EntityListAccessor.js'

export type GetEntityListSubTree = (
	parametersOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
	treeId?: TreeRootId,
	environment?: Environment,
) => EntityListAccessor
