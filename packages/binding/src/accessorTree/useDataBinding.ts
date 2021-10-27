import {
	useCurrentContentGraphQlClient,
	useCurrentSystemGraphQlClient,
	useTenantGraphQlClient,
} from '@contember/react-client'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useEnvironment } from '../accessorPropagation'
import type { TreeRootAccessor } from '../accessors'
import { DataBinding } from '../core'
import type { AccessorTreeState } from './AccessorTreeState'
import type { AccessorTreeStateOptions } from './AccessorTreeStateOptions'
import { accessorTreeStateReducer } from './accessorTreeStateReducer'
import type { RequestError } from './RequestError'

const initialState: AccessorTreeState = {
	name: 'initializing',
}

export const useDataBinding = ({
	nodeTree,
	refreshOnEnvironmentChange = true,
	refreshOnPersist = false,
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
			type: 'setData',
			data: accessor,
		})
	}, [])
	const onError = useCallback((error: RequestError) => {
		if (!isMountedRef.current) {
			return
		}
		dispatch({
			type: 'failWithError',
			error,
		})
	}, [])

	const createDataBinding = useCallback(
		() => {
			const create = (): DataBinding => new DataBinding(contentClient, systemClient, tenantClient, environment, onUpdate, onError, () => {
				if (!isMountedRef.current || !refreshOnPersist) {
					return
				}
				dispatch({ type: 'reset' })
				setDataBinding(create())
			})
			return create()
		},
		[contentClient, systemClient, tenantClient, environment, onUpdate, onError, refreshOnPersist],
	)

	const [dataBinding, setDataBinding] = useState(() => createDataBinding())

	useEffect(() => {
		if (state.name !== 'initializing') {
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
		dispatch({ type: 'reset' })
		// This essentially just reacts to new environments.
		setDataBinding(createDataBinding())
	}, [createDataBinding, refreshOnEnvironmentChange])

	useEffect(() => {
		isFirstRenderRef.current = false

		return () => {
			isMountedRef.current = false
		}
	}, [])

	return state
}
