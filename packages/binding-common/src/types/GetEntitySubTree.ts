import type { Environment } from '../environment/index.js'
import type { Alias, SugaredQualifiedSingleEntity, SugaredUnconstrainedQualifiedSingleEntity, TreeRootId } from '../treeParameters/index.js'
import type { EntityAccessor } from './EntityAccessor.js'

export type GetEntitySubTree = (
	parametersOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
	treeId?: TreeRootId,
	environment?: Environment,
) => EntityAccessor
