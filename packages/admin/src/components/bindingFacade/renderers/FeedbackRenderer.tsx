import type { AccessorTreeState } from '@contember/binding'
import { ContainerSpinner, Message } from '@contember/ui'
import { ReactNode, useEffect } from 'react'
import { useRedirect } from '../../../routing'

export interface FeedbackRendererProps {
	accessorTreeState: AccessorTreeState
	children: ReactNode
}

export function FeedbackRenderer({ accessorTreeState, children }: FeedbackRendererProps) {
	const redirect = useRedirect()

	useEffect(() => {
		if (accessorTreeState.name === 'error' && accessorTreeState.error.type === 'unauthorized') {
			window.location.href = '/' // redirect to login
		}
	}, [accessorTreeState, redirect])

	if (accessorTreeState.name === 'initializing') {
		return <ContainerSpinner />
	}

	if (accessorTreeState.name === 'error') {
		switch (accessorTreeState.error.type) {
			case 'unauthorized':
				return null // This results in a redirect for now, and so the actual handling is in an effect

			case 'networkError':
				if (import.meta.env.DEV) {
					throw new Error(accessorTreeState.error.metadata.responseText)
				}

				return <Message intent="danger">Network error</Message>

			case 'gqlError':
				if (import.meta.env.DEV) {
					throw new Error(JSON.stringify(accessorTreeState.error.errors, null, '  '))
				}

				return <Message intent="danger">Unknown error</Message>

			case 'unknownError':
			default:
				return <Message intent="danger">Unknown error</Message> // TODO
		}
	}

	return <>{children}</>
}
