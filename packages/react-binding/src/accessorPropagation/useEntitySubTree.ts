import { useCallback } from 'react'
import type { EntityAccessor } from '@contember/binding'
import type { Alias, SugaredQualifiedSingleEntity, SugaredUnconstrainedQualifiedSingleEntity } from '@contember/binding'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useEntitySubTreeParameters } from './useEntitySubTreeParameters'
import { useGetEntitySubTree } from './useGetEntitySubTree'
import { TreeRootId } from '@contember/binding'

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
	return useAccessorUpdateSubscription(getAccessor)
}
