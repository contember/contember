import {
	GraphQlClientError,
	useCurrentContentGraphQlClient,
	useCurrentSystemGraphQlClient,
	useTenantGraphQlClient,
} from '@contember/react-client'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import type { TreeRootAccessor } from '@contember/binding'
import { DataBinding, Environment, TreeStore } from '@contember/binding'
import type { AccessorTreeState } from './AccessorTreeState'
import { useIsMounted } from '@contember/react-utils'
import { MarkerTreeGenerator } from '../markers'
import ReactDOM from 'react-dom'
import { useEnvironmentWithSchema } from './useEnvironmentWithSchema'
import { useEnvironment } from '../accessorPropagation'

export const useDataBinding = ({
	children,
	refreshOnPersist,
	skipStateUpdateAfterPersist,
}: {
	children?: ReactNode
	refreshOnPersist?: boolean
	skipStateUpdateAfterPersist?: boolean
}): AccessorTreeState => {
	const contentClient = useCurrentContentGraphQlClient()
	const systemClient = useCurrentSystemGraphQlClient()
	const tenantClient = useTenantGraphQlClient()

	const environment = useEnvironment()
	const environmentWithSchema = useEnvironmentWithSchema(environment)

	const currentTreeStore = useRef<TreeStore>()
	const isMountedRef = useIsMounted()

	const [state, setState] = useState<AccessorTreeState & { binding?: DataBinding<ReactNode> }>({
		name: 'initializing',
		environment,
	})

	const resetDataBinding = useCallback((environment: Environment, newStore: boolean) => {
		const onUpdate = (data: TreeRootAccessor<ReactNode>, binding: DataBinding<ReactNode>) => {
			if (isMountedRef.current) {
				setState(it => it.name === 'error' || it.binding !== binding ? it : {
					name: 'initialized',
					environment,
					binding,
					data,
				})
			}
		}

		const onError = (error: GraphQlClientError, binding: DataBinding<ReactNode>) => {
			if (isMountedRef.current) {
				setState(it => it.binding !== binding ? it :  {
					name: 'error',
					environment,
					binding,
					error,
				})
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
		setState({ binding, environment, name: 'initializing' })

	}, [contentClient, systemClient, tenantClient, isMountedRef, refreshOnPersist, skipStateUpdateAfterPersist])


	useEffect(() => {
		if (environmentWithSchema) {
			resetDataBinding(environmentWithSchema, false)
		}
	}, [resetDataBinding, environmentWithSchema])

	useEffect(() => {
		state.binding?.extendTree(children)
	}, [children, state.binding])

	return state
}
