import { useCallback } from 'react'
import {
	Alias,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedSingleEntity,
	TreeRootId,
} from '../treeParameters'
import { useBindingOperations } from './useBindingOperations'
import { useEnvironment } from './useEnvironment'
import { useTreeRootId } from './useTreeRootId'

export const useGetEntitySubTree = () => {
	const environment = useEnvironment()
	const getEntitySubTree = useBindingOperations().getEntitySubTree
	const treeRootId = useTreeRootId()

	return useCallback(
		(
			parametersOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
			...treeId: [TreeRootId | undefined] | []
		) => getEntitySubTree(parametersOrAlias, treeId.length === 0 ? treeRootId : treeId[0], environment),
		[environment, getEntitySubTree, treeRootId],
	)
}
