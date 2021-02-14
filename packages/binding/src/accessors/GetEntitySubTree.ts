import { Environment } from '../dao'
import {
	Alias,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedSingleEntity,
	TreeRootId,
} from '../treeParameters'
import { EntityAccessor } from './EntityAccessor'

export type GetEntitySubTree = (
	parametersOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
	treeId?: TreeRootId,
	environment?: Environment,
) => EntityAccessor
