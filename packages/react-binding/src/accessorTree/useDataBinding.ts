import {
	GraphQlClientFailedRequestMetadata,
	useCurrentContentGraphQlClient,
	useCurrentSystemGraphQlClient,
	useTenantGraphQlClient,
} from '@contember/react-client'
import { ReactNode, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useEnvironment } from '../accessorPropagation'
import type { TreeRootAccessor } from '@contember/binding'
import { DataBinding } from '@contember/binding'
import type { AccessorTreeState } from './AccessorTreeState'
import type { AccessorTreeStateOptions } from './AccessorTreeStateOptions'
import { accessorTreeStateReducer } from './accessorTreeStateReducer'
import { metadataToRequestError } from '@contember/binding'
import type { RequestError } from '@contember/binding'
import { Environment } from '@contember/binding'
import { Schema, SchemaLoader } from '@contember/binding'
import { TreeStore } from '@contember/binding'
import { useIsMounted } from '@contember/react-utils'
import { MarkerTreeGenerator } from '../MarkerTreeGenerator'
import ReactDOM from 'react-dom'

export const useDataBinding = ({
	children,
	refreshOnPersist,
	skipStateUpdateAfterPersist,
}: AccessorTreeStateOptions): AccessorTreeState => {
	const contentClient = useCurrentContentGraphQlClient()
	const systemClient = useCurrentSystemGraphQlClient()
	const tenantClient = useTenantGraphQlClient()
	const environment = useEnvironment()
	const currentTreeStore = useRef<TreeStore>()
	const isMountedRef = useIsMounted()
	const [schema, setSchema] = useState<Schema>()

	const resetDataBinding = useCallback((environment: Environment, newStore: boolean) => {
		const onUpdate = (data: TreeRootAccessor<ReactNode>, binding: DataBinding<ReactNode>) => {
			if (isMountedRef.current) {
				dispatch({ type: 'setData', data, binding })
			}
		}

		const onError = (error: RequestError, binding: DataBinding<ReactNode>) => {
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

		const binding = new DataBinding(
			contentClient,
			systemClient,
			tenantClient,
			currentTreeStore.current,
			environment,
			(node, env) => {
				const gen = new MarkerTreeGenerator(node, env)
				return gen.generate()
			},
			ReactDOM.unstable_batchedUpdates,
			onUpdate,
			onError,
			onPersistSuccess,
			{
				skipStateUpdateAfterPersist: skipStateUpdateAfterPersist ?? false,
			},
		)
		dispatch({ type: 'reset', binding, environment })
	}, [contentClient, systemClient, tenantClient, isMountedRef, refreshOnPersist, skipStateUpdateAfterPersist])

	const [state, dispatch] = useReducer(accessorTreeStateReducer, {
		name: 'initializing',
		environment,
	})

	useEffect(() => {
		if (schema !== undefined) {
			return
		}

		(async () => {
			try {
				setSchema(await SchemaLoader.loadSchema(contentClient))

			} catch (metadata) {
				if (typeof metadata === 'object' && metadata !== null && (metadata as { name?: unknown }).name === 'AbortError') {
					return
				}

				if (isMountedRef.current) {
					dispatch({
						type: 'failWithError',
						error: metadataToRequestError(metadata as GraphQlClientFailedRequestMetadata),
						binding: state.binding!,
					})
				}
			}
		})()
	}, [contentClient, isMountedRef, schema, state.binding])

	useEffect(() => {
		if (schema) {
			resetDataBinding(environment.withSchema(schema), false)
		}
	}, [resetDataBinding, schema, environment])

	useEffect(() => {
		state.binding?.extendTree(children)
	}, [children, state.binding])

	return state
}
