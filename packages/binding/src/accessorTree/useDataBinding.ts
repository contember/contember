import {
	useCurrentContentGraphQlClient,
	useCurrentSystemGraphQlClient,
	useTenantGraphQlClient,
} from '@contember/react-client'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
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

export const useDataBinding = ({
	nodeTree,
	refreshOnEnvironmentChange = true,
}: AccessorTreeStateOptions): AccessorTreeState => {
	const contentClient = useCurrentContentGraphQlClient()
	const systemClient = useCurrentSystemGraphQlClient()
	const tenantClient = useTenantGraphQlClient()
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

	const [dataBinding, setDataBinding] = useState(
		() => new DataBinding(contentClient, systemClient, tenantClient, environment, onUpdate, onError),
	)

	useEffect(() => {
		if (state.name !== AccessorTreeStateName.Initializing) {
			// Ideally, this condition shouldn't be necessary. However, people are nowhere near careful and diligent
			// enough to maintain the contract that a change in referential identity of the children passed to
			// DataBindingProvider will result in a new DataBinding instance (which typically involves a new query).
			// To make their lives a bit easier, we do this.
			return
		}
		dataBinding.extendTree(nodeTree)
	}, [nodeTree, dataBinding, state.name])

	useEffect(() => {
		if (isFirstRenderRef.current || !refreshOnEnvironmentChange) {
			return
		}
		dispatch({
			type: AccessorTreeStateActionType.Reset,
		})
		// This essentially just reacts to new environments.
		setDataBinding(new DataBinding(contentClient, systemClient, tenantClient, environment, onUpdate, onError))
	}, [contentClient, environment, onError, onUpdate, refreshOnEnvironmentChange, systemClient, tenantClient])

	useEffect(() => {
		isFirstRenderRef.current = false

		return () => {
			isMountedRef.current = false
		}
	}, [])

	return state
}
