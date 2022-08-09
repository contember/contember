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

export const useDataBinding = ({
	nodeTree,
	refreshOnEnvironmentChange = true,
	refreshOnPersist = false,
}: AccessorTreeStateOptions): AccessorTreeState => {
	const contentClient = useCurrentContentGraphQlClient()
	const systemClient = useCurrentSystemGraphQlClient()
	const tenantClient = useTenantGraphQlClient()
	const environment = useEnvironment()


	const isFirstRenderRef = useRef(true)
	const isMountedRef = useRef(true)

	const onUpdate = useCallback((accessor: TreeRootAccessor, binding: DataBinding) => {
		if (!isMountedRef.current) {
			return
		}
		dispatch({
			type: 'setData',
			data: accessor,
			binding,
		})
	}, [])
	const onError = useCallback((error: RequestError, binding: DataBinding) => {
		if (!isMountedRef.current) {
			return
		}
		dispatch({
			type: 'failWithError',
			error,
			binding,
		})
	}, [])

	const createDataBinding = useCallback(
		() => {
			const create = (): DataBinding => new DataBinding(contentClient, systemClient, tenantClient, environment, onUpdate, onError, () => {
				if (!isMountedRef.current || !refreshOnPersist) {
					return
				}
				const binding = create()
				dispatch({ type: 'reset', binding })
			})
			return create()
		},
		[contentClient, systemClient, tenantClient, environment, onUpdate, onError, refreshOnPersist],
	)
	const [initialState] = useState(() => ({
		binding: createDataBinding(),
		name: 'initializing' as const,
	}))
	const [state, dispatch] = useReducer(accessorTreeStateReducer, initialState)

	useEffect(() => {
		if (state.name !== 'initializing') {
			// Ideally, this condition shouldn't be necessary. However, people are nowhere near careful and diligent
			// enough to maintain the contract that a change in referential identity of the children passed to
			// DataBindingProvider will result in a new DataBinding instance (which typically involves a new query).
			// To make their lives a bit easier, we do this.
			return
		}
		state.binding.extendTree(nodeTree)
	}, [nodeTree, state.binding, state.name])

	useEffect(() => {
		if (isFirstRenderRef.current || !refreshOnEnvironmentChange) {
			return
		}
		// This essentially just reacts to new environments.
		const binding = createDataBinding()
		dispatch({ type: 'reset', binding })
	}, [createDataBinding, refreshOnEnvironmentChange])

	useEffect(() => {
		isFirstRenderRef.current = false

		return () => {
			isMountedRef.current = false
		}
	}, [])

	return state
}
