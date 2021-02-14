import * as React from 'react'
import {
	Alias,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedSingleEntity,
	TreeRootId,
} from '../treeParameters'
import { useBindingOperations } from './useBindingOperations'
import { useEnvironment } from './useEnvironment'

export const useGetEntitySubTree = () => {
	const environment = useEnvironment()
	const getEntitySubTree = useBindingOperations().getEntitySubTree

	return React.useCallback(
		(
			parametersOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
			treeId?: TreeRootId,
		) => getEntitySubTree(parametersOrAlias, treeId, environment),
		[environment, getEntitySubTree],
	)
}
