import { AccessorTreeState, AccessorTreeStateName, RequestErrorType } from '@contember/binding'
import { ContainerSpinner, Message } from '@contember/ui'
import * as React from 'react'
import { useRedirect } from '../../pageRouting'

export interface FeedbackRendererProps {
	accessorTreeState: AccessorTreeState
	children: React.ReactNode
}

export function FeedbackRenderer({ accessorTreeState, children }: FeedbackRendererProps) {
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
			default:
				return <Message type="danger">Unknown error</Message> // TODO
		}
	}

	return <>{children}</>
}
