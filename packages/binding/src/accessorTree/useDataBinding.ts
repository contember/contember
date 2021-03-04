import { useCurrentContentGraphQlClient } from '@contember/react-client'
import { useReducer, useRef, useCallback, useState, useEffect } from 'react'
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

	const [state, dispatch] = useReducer(accessorTreeStateReducer, initialState)

	const isFirstRenderRef = useRef(true)
	const isMountedRef = useRef(true)

	const onUpdate = useCallback((accessor: TreeRootAccessor) => {
		if (!isMountedRef.current) {
			return
		}
		dispatch({
			type: AccessorTreeStateActionType.SetData,
			data: accessor,
		})
	}, [])
	const onError = useCallback((error: RequestError) => {
		if (!isMountedRef.current) {
			return
		}
		dispatch({
			type: AccessorTreeStateActionType.FailWithError,
			error,
		})
	}, [])

	// TODO This won't react to changes of the params
	const [dataBinding] = useState(() => new DataBinding(client, environment, onUpdate, onError))

	useEffect(() => {
		if (!isFirstRenderRef.current) {
			return
		}
		dataBinding.extendTree(nodeTree)
	}, [nodeTree, dataBinding])

	useEffect(() => {
		isFirstRenderRef.current = false

		return () => {
			isMountedRef.current = false
		}
	}, [])

	return state
}
