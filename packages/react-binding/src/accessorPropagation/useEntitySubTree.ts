import { useCallback } from 'react'
import type { Alias, EntityAccessor, SugaredQualifiedSingleEntity, SugaredUnconstrainedQualifiedSingleEntity } from '@contember/binding'
import { TreeRootId } from '@contember/binding'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useEntitySubTreeParameters } from './useEntitySubTreeParameters'
import { useGetEntitySubTree } from './useGetEntitySubTree'

export const useEntitySubTree = (
	qualifiedSingleEntity: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
	...treeId: [TreeRootId | undefined] | []
): EntityAccessor => {
	const getSubTree = useGetEntitySubTree()
	const parameters = useEntitySubTreeParameters(qualifiedSingleEntity)
	const hasTreeId = treeId.length > 0
	const treeIdVal = treeId[0]
	const getAccessor = useCallback(
		() => getSubTree(parameters, ...(hasTreeId ? [treeIdVal] : [])),
		[getSubTree, hasTreeId, parameters, treeIdVal],
	)

	// if (typeof parameters !== 'string' && parameters.hasOneRelationPath.length) {
	// 	throw new BindingError(`useEntitySubTree: cannot use hasOneRelationPath!`)
	// }
	return useAccessorUpdateSubscription(getAccessor)[0]
}
