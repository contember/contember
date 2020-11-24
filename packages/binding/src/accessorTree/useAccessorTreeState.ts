import { useCurrentContentGraphQlClient } from '@contember/react-client'
import * as React from 'react'
import { useEnvironment } from '../accessorPropagation'
import { TreeRootAccessor } from '../accessors'
import { AccessorTreeGenerator, MarkerTreeGenerator } from '../core'
import { AccessorTreeState, AccessorTreeStateName } from './AccessorTreeState'
import { AccessorTreeStateActionType } from './AccessorTreeStateActionType'
import { AccessorTreeStateOptions } from './AccessorTreeStateOptions'
import { accessorTreeStateReducer } from './accessorTreeStateReducer'
import { RequestError } from './RequestError'

const initialState: AccessorTreeState = {
	name: AccessorTreeStateName.Initializing,
}

export const useAccessorTreeState = ({ nodeTree }: AccessorTreeStateOptions): AccessorTreeState => {
	const client = useCurrentContentGraphQlClient()
	const environment = useEnvironment()

	const markerTree = React.useMemo(() => new MarkerTreeGenerator(nodeTree, environment).generate(), [
		environment,
		nodeTree,
	])
	const isMountedRef = React.useRef(true)

	const onUpdate = React.useCallback((accessor: TreeRootAccessor) => {
		if (!isMountedRef.current) {
			return
		}
		dispatch({
			type: AccessorTreeStateActionType.SetData,
			data: accessor,
		})
	}, [])
	const onError = React.useCallback((error: RequestError) => {
		if (!isMountedRef.current) {
			return
		}
		dispatch({
			type: AccessorTreeStateActionType.FailWithError,
			error,
		})
	}, [])

	// TODO this REALLY should be useState.
	const accessorTreeGenerator = React.useMemo(() => new AccessorTreeGenerator(markerTree, client, onUpdate, onError), [
		client,
		markerTree,
		onError,
		onUpdate,
	])
	const [state, dispatch] = React.useReducer(accessorTreeStateReducer, initialState)

	React.useEffect(() => {
		accessorTreeGenerator.initializeLiveTree()
	}, [accessorTreeGenerator])

	React.useEffect(() => {
		return () => {
			isMountedRef.current = false
		}
	}, [])

	return state
}
