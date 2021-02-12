import { Environment } from '../dao'
import { Alias, SugaredQualifiedEntityList, SugaredUnconstrainedQualifiedEntityList } from '../treeParameters'
import { EntityListAccessor } from './EntityListAccessor'

export type GetEntityListSubTree = (
	parametersOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
	environment?: Environment,
) => EntityListAccessor
