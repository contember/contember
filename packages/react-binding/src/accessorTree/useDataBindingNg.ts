import {
	GraphQlClientError,
	useCurrentContentGraphQlClient,
	useCurrentSystemGraphQlClient,
	useTenantGraphQlClient,
} from '@contember/react-client'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { Environment } from '@contember/binding'
import type { AccessorTreeState } from './AccessorTreeState'
import { useIsMounted } from '@contember/react-utils'
import { MarkerTreeGenerator } from '../markers'
import { useEnvironmentWithSchema } from './useEnvironmentWithSchema'
import { useEnvironment } from '../accessorPropagation'
import { DataBindingNg } from '@contember/binding-ng'

export const useDataBindingNg = ({
	children,
}: {
	children?: ReactNode
}): AccessorTreeState => {
	const contentClient = useCurrentContentGraphQlClient()
	const systemClient = useCurrentSystemGraphQlClient()
	const tenantClient = useTenantGraphQlClient()

	const environment = useEnvironment()
	const environmentWithSchema = useEnvironmentWithSchema(environment)

	const isMountedRef = useIsMounted()

	const [state, setState] = useState<AccessorTreeState & { binding?: DataBindingNg<ReactNode> }>({
		name: 'initializing',
		environment,
	})

	const resetDataBinding = useCallback((environment: Environment) => {

		const onError = (error: GraphQlClientError, binding: DataBindingNg<ReactNode>) => {
			if (isMountedRef.current) {
				setState(it => it.binding !== binding ? it :  {
					name: 'error',
					environment,
					binding,
					error,
				})
			}
		}

		const binding = new DataBindingNg<ReactNode>(
			contentClient,
			systemClient,
			tenantClient,
			environment,

			(node, env) => {
				const gen = new MarkerTreeGenerator(node, env)
				return gen.generate()
			},

		)
		setState({ binding, environment, name: 'initializing' })

		binding.addEventListener('update', ({ accessor }) => {
			if (isMountedRef.current) {
				setState(it => it.name === 'error' || it.binding !== binding ? it : {
					name: 'initialized',
					environment,
					binding,
					data: accessor,
				})
			}
		})

	}, [contentClient, systemClient, tenantClient, isMountedRef])


	useEffect(() => {
		if (environmentWithSchema) {
			resetDataBinding(environmentWithSchema)
		}
	}, [resetDataBinding, environmentWithSchema])

	useEffect(() => {
		state.binding?.extendTree(children)
	}, [children, state.binding])

	return state
}
