import { Environment } from '../dao'
import {
	Alias,
	SugaredQualifiedEntityList,
	SugaredUnconstrainedQualifiedEntityList,
	TreeRootId,
} from '../treeParameters'
import { EntityListAccessor } from './EntityListAccessor'

export type GetEntityListSubTree = (
	parametersOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
	treeId?: TreeRootId,
	environment?: Environment,
) => EntityListAccessor
