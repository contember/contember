import * as React from 'react'
import { QueryLanguage } from '../queryLanguage'
import {
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedSingleEntity,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { useEntityAccessorUpdateSubscription } from './useEntityAccessorUpdateSubscription'
import { useEnvironment } from './useEnvironment'
import { useGetSubTree } from './useGetSubTree'

export type UseSingleEntitySubTreeProps =
	| ({
			isCreating?: false
	  } & SugaredQualifiedSingleEntity)
	| ({
			isCreating: true
	  } & SugaredUnconstrainedQualifiedSingleEntity)

export const useSingleEntitySubTree = (qualifiedSingleEntity: UseSingleEntitySubTreeProps) => {
	const getSubTree = useGetSubTree()
	const environment = useEnvironment()

	// TODO this super bad. It's too sensitive to unwanted updates due to qualifiedSingleEntity changes.
	const parameters: BoxedQualifiedSingleEntity | BoxedUnconstrainedQualifiedSingleEntity = React.useMemo(() => {
		if ('isCreating' in qualifiedSingleEntity && qualifiedSingleEntity.isCreating) {
			return new BoxedUnconstrainedQualifiedSingleEntity(
				QueryLanguage.desugarUnconstrainedQualifiedSingleEntity(qualifiedSingleEntity, environment),
			)
		}
		return new BoxedQualifiedSingleEntity(
			QueryLanguage.desugarQualifiedSingleEntity(qualifiedSingleEntity, environment),
		)
	}, [environment, qualifiedSingleEntity])
	const getAccessor = React.useCallback(() => getSubTree(parameters), [getSubTree, parameters])

	return useEntityAccessorUpdateSubscription(getAccessor)
}
