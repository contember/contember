import * as React from 'react'
import { Alias, SugaredQualifiedEntityList, SugaredUnconstrainedQualifiedEntityList } from '../treeParameters'
import { useBindingOperations } from './useBindingOperations'
import { useEnvironment } from './useEnvironment'

export const useGetEntityListSubTree = () => {
	const environment = useEnvironment()
	const getEntityListSubTree = useBindingOperations().getEntityListSubTree

	return React.useCallback(
		(parametersOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList) =>
			getEntityListSubTree(parametersOrAlias, environment),
		[environment, getEntityListSubTree],
	)
}
