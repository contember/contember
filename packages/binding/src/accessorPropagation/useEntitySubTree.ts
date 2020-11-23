import * as React from 'react'
import { BindingError } from '../BindingError'
import { Alias } from '../treeParameters'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useGetEntitySubTree } from './useGetEntitySubTree'
import {
	QualifiedSingleEntityProps,
	UnconstrainedQualifiedSingleEntityProps,
	useEntitySubTreeParameters,
} from './useEntitySubTreeParameters'

export type UseEntitySubTreeProps = Alias | QualifiedSingleEntityProps | UnconstrainedQualifiedSingleEntityProps

export const useEntitySubTree = (qualifiedSingleEntity: UseEntitySubTreeProps) => {
	const getSubTree = useGetEntitySubTree()
	const parameters = useEntitySubTreeParameters(qualifiedSingleEntity)
	const getAccessor = React.useCallback(() => getSubTree(parameters), [getSubTree, parameters])
	const accessor = useAccessorUpdateSubscription(getAccessor)

	if (typeof parameters !== 'string' && parameters.value.hasOneRelationPath.length) {
		throw new BindingError(`useEntitySubTree: cannot use hasOneRelationPath!`)
	}
	return accessor
}
