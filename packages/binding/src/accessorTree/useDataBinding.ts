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
import { Environment } from '../dao'
import { Schema, SchemaLoader } from '../core/schema'
import { TreeStore } from '../core/TreeStore'
import { useIsMounted } from '@contember/react-utils'

export const useDataBinding = ({
	nodeTree,
	refreshOnPersist = false,
}: AccessorTreeStateOptions): AccessorTreeState => {
	const contentClient = useCurrentContentGraphQlClient()
	const systemClient = useCurrentSystemGraphQlClient()
	const tenantClient = useTenantGraphQlClient()
	const environment = useEnvironment()
	const currentTreeStore = useRef<TreeStore>()
	const isMountedRef = useIsMounted()
	const [schema, setSchema] = useState<Schema>()

	const resetDataBinding = useCallback((environment: Environment, newStore: boolean) => {
		const onUpdate = (data: TreeRootAccessor, binding: DataBinding) => {
			if (isMountedRef.current) {
				dispatch({ type: 'setData', data, binding })
			}
		}

		const onError = (error: RequestError, binding: DataBinding) => {
			if (isMountedRef.current) {
				dispatch({ type: 'failWithError', error, binding })
			}
		}

		const onPersistSuccess = () => {
			if (isMountedRef.current && refreshOnPersist) {
				resetDataBinding(environment, true)
			}
		}

		if (currentTreeStore.current === undefined || newStore) {
			currentTreeStore.current = new TreeStore(environment.getSchema())
		}

		const binding = new DataBinding(contentClient, systemClient, tenantClient, currentTreeStore.current, environment, onUpdate, onError, onPersistSuccess)
		dispatch({ type: 'reset', binding, environment })
	}, [contentClient, systemClient, tenantClient, isMountedRef, refreshOnPersist])

	const [state, dispatch] = useReducer(accessorTreeStateReducer, {
		name: 'initializing',
		environment,
	})

	useEffect(() => {
		(async () => {
			setSchema(await SchemaLoader.loadSchema(contentClient))
		})()
	}, [contentClient])

	useEffect(() => {
		if (schema) {
			resetDataBinding(environment.withSchema(schema), false)
		}
	}, [resetDataBinding, schema, environment])

	useEffect(() => {
		state.binding?.extendTree(nodeTree)
	}, [nodeTree, state.binding])

	return state
}
