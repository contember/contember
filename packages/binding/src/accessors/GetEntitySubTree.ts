import { Environment } from '../dao'
import { Alias, SugaredQualifiedSingleEntity, SugaredUnconstrainedQualifiedSingleEntity } from '../treeParameters'
import { EntityAccessor } from './EntityAccessor'

export type GetEntitySubTree = (
	parametersOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
	environment?: Environment,
) => EntityAccessor
