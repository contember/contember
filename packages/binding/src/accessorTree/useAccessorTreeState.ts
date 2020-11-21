import { useCurrentContentGraphQlClient } from '@contember/react-client'
import * as React from 'react'
import { useEnvironment } from '../accessorPropagation'
import { AccessorTreeGenerator, MarkerTreeGenerator } from '../core'
import { AccessorTreeState, AccessorTreeStateName } from './AccessorTreeState'
import { AccessorTreeStateActionType } from './AccessorTreeStateActionType'
import { AccessorTreeStateOptions } from './AccessorTreeStateOptions'
import { accessorTreeStateReducer } from './accessorTreeStateReducer'

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

	// TODO this REALLY should be useState.
	const accessorTreeGenerator = React.useMemo(() => new AccessorTreeGenerator(markerTree, client), [client, markerTree])
	const [state, dispatch] = React.useReducer(accessorTreeStateReducer, initialState)

	const isMountedRef = React.useRef(true)

	React.useEffect(() => {
		accessorTreeGenerator.initializeLiveTree(
			accessor => {
				if (!isMountedRef.current) {
					return
				}
				dispatch({
					type: AccessorTreeStateActionType.SetData,
					data: accessor,
				})
			},
			error => {
				if (!isMountedRef.current) {
					return
				}
				dispatch({
					type: AccessorTreeStateActionType.FailWithError,
					error,
				})
			},
		)
	}, [accessorTreeGenerator])

	React.useEffect(() => {
		return () => {
			isMountedRef.current = false
		}
	}, [])

	return state
}
