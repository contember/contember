import type { Environment } from '../environment'
import type {
	Alias,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedSingleEntity,
	TreeRootId,
} from '../treeParameters'
import type { EntityAccessor } from './EntityAccessor'

export type GetEntitySubTree = (
	parametersOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
	treeId?: TreeRootId,
	environment?: Environment,
) => EntityAccessor
