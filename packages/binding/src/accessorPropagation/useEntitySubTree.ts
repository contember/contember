import * as React from 'react'
import { Alias, SugaredQualifiedSingleEntity, SugaredUnconstrainedQualifiedSingleEntity } from '../treeParameters'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useEntitySubTreeParameters } from './useEntitySubTreeParameters'
import { useGetEntitySubTree } from './useGetEntitySubTree'

export const useEntitySubTree = (
	qualifiedSingleEntity: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
) => {
	const getSubTree = useGetEntitySubTree()
	const parameters = useEntitySubTreeParameters(qualifiedSingleEntity)
	const getAccessor = React.useCallback(() => getSubTree(parameters), [getSubTree, parameters])

	// if (typeof parameters !== 'string' && parameters.hasOneRelationPath.length) {
	// 	throw new BindingError(`useEntitySubTree: cannot use hasOneRelationPath!`)
	// }
	return useAccessorUpdateSubscription(getAccessor)
}
