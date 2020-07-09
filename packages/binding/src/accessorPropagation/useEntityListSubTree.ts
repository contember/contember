import * as React from 'react'
import { BindingError } from '../BindingError'
import { SugaredQualifiedEntityList, SugaredUnconstrainedQualifiedEntityList } from '../treeParameters'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useEntityListSubTreeParameters } from './useEntityListSubTreeParameters'
import { useGetSubTree } from './useGetSubTree'

export type UseEntityListSubTreeProps =
	| ({
			isCreating?: false
	  } & SugaredQualifiedEntityList)
	| ({
			isCreating: true
	  } & SugaredUnconstrainedQualifiedEntityList)

export const useEntityListSubTree = (qualifiedEntityList: UseEntityListSubTreeProps) => {
	const getSubTree = useGetSubTree()
	const parameters = useEntityListSubTreeParameters(qualifiedEntityList)
	const getAccessor = React.useCallback(() => getSubTree(parameters), [getSubTree, parameters])
	const accessor = useAccessorUpdateSubscription(getAccessor)

	if (parameters.value.hasOneRelationPath.length) {
		throw new BindingError(`useEntityListSubTree: cannot use hasOneRelationPath!`)
	}

	return accessor
}
