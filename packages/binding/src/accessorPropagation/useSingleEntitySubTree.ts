import * as React from 'react'
import { BindingError } from '../BindingError'
import { Alias } from '../treeParameters'
import { useAccessorUpdateSubscription } from './useAccessorUpdateSubscription'
import { useGetEntitySubTree } from './useGetEntitySubTree'
import {
	QualifiedSingleEntityProps,
	UnconstrainedQualifiedSingleEntityProps,
	useSingleEntitySubTreeParameters,
} from './useSingleEntitySubTreeParameters'

export type UseSingleEntitySubTreeProps = Alias | QualifiedSingleEntityProps | UnconstrainedQualifiedSingleEntityProps

export const useSingleEntitySubTree = (qualifiedSingleEntity: UseSingleEntitySubTreeProps) => {
	const getSubTree = useGetEntitySubTree()
	const parameters = useSingleEntitySubTreeParameters(qualifiedSingleEntity)
	const getAccessor = React.useCallback(() => getSubTree(parameters), [getSubTree, parameters])
	const accessor = useAccessorUpdateSubscription(getAccessor)

	if (typeof parameters !== 'string' && parameters.value.hasOneRelationPath.length) {
		throw new BindingError(`useSingleEntitySubTree: cannot use hasOneRelationPath!`)
	}
	return accessor
}
