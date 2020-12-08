import { useCurrentContentGraphQlClient } from '@contember/react-client'
import * as React from 'react'
import { useEnvironment } from '../accessorPropagation'
import { TreeRootAccessor } from '../accessors'
import { DataBinding } from '../core'
import { AccessorTreeState, AccessorTreeStateName } from './AccessorTreeState'
import { AccessorTreeStateActionType } from './AccessorTreeStateActionType'
import { AccessorTreeStateOptions } from './AccessorTreeStateOptions'
import { accessorTreeStateReducer } from './accessorTreeStateReducer'
import { RequestError } from './RequestError'

const initialState: AccessorTreeState = {
	name: AccessorTreeStateName.Initializing,
}

export const useDataBinding = ({ nodeTree }: AccessorTreeStateOptions): AccessorTreeState => {
	const client = useCurrentContentGraphQlClient()
	const environment = useEnvironment()

	const [state, dispatch] = React.useReducer(accessorTreeStateReducer, initialState)

	const isFirstRenderRef = React.useRef(true)
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

	// TODO This won't react to changes of the params
	const [dataBinding] = React.useState(() => new DataBinding(client, environment, onUpdate, onError))

	React.useEffect(() => {
		if (!isFirstRenderRef.current) {
			return
		}
		dataBinding.extendTree(nodeTree)
	}, [nodeTree, dataBinding])

	React.useEffect(() => {
		isFirstRenderRef.current = false

		return () => {
			isMountedRef.current = false
		}
	}, [])

	return state
}
