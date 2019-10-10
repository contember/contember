import { ContainerSpinner, Message } from '@contember/ui'
import { assertNever } from '@contember/utils'
import * as React from 'react'
import { useRedirect } from '../../../components'
import {
	AccessorTreeStateContext,
	AccessorTreeStateName,
	AccessorTreeStateWithDataContext,
	RequestErrorType,
} from '../../accessorTree'
import { Component } from '../../coreComponents'

export interface CommonRendererProps {
	children: React.ReactNode
}

export const CommonRenderer = Component<CommonRendererProps>(
	({ children }) => {
		const accessorTreeState = React.useContext(AccessorTreeStateContext)
		const redirect = useRedirect()

		React.useEffect(() => {
			if (
				accessorTreeState.name === AccessorTreeStateName.RequestError &&
				accessorTreeState.error.type === RequestErrorType.Unauthorized
			) {
				redirect(() => ({ name: 'login' }))
			}
		}, [accessorTreeState, redirect])

		if (
			accessorTreeState.name === AccessorTreeStateName.Uninitialized ||
			accessorTreeState.name === AccessorTreeStateName.Querying
		) {
			return <ContainerSpinner />
		}
		if (accessorTreeState.name === AccessorTreeStateName.RequestError) {
			switch (accessorTreeState.error.type) {
				case RequestErrorType.Unauthorized:
					return null // This results in a redirect for now, and so the actual handling is in an effect
				case RequestErrorType.NetworkError:
					return <Message type="danger">Network error</Message> // TODO
				case RequestErrorType.UnknownError:
					return <Message type="danger">Unknown error</Message> // TODO
			}
			return assertNever(accessorTreeState.error)
		}

		return (
			<AccessorTreeStateWithDataContext.Provider value={accessorTreeState}>
				{children}
			</AccessorTreeStateWithDataContext.Provider>
		)
	},
	(props: CommonRendererProps): React.ReactNode => props.children,
	'CommonRenderer',
)
