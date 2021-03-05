import { AccessorTreeState, AccessorTreeStateName, RequestErrorType } from '@contember/binding'
import { ContainerSpinner, Message } from '@contember/ui'
import { ReactNode, useEffect } from 'react'
import { useRedirect } from '../../pageRouting'

export interface FeedbackRendererProps {
	accessorTreeState: AccessorTreeState
	children: ReactNode
}

export function FeedbackRenderer({ accessorTreeState, children }: FeedbackRendererProps) {
	const redirect = useRedirect()

	useEffect(() => {
		if (
			accessorTreeState.name === AccessorTreeStateName.Error &&
			accessorTreeState.error.type === RequestErrorType.Unauthorized
		) {
			redirect(() => ({ name: 'login' }))
		}
	}, [accessorTreeState, redirect])

	if (accessorTreeState.name === AccessorTreeStateName.Initializing) {
		return <ContainerSpinner />
	}
	if (accessorTreeState.name === AccessorTreeStateName.Error) {
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
