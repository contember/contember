import type { AccessorTreeState } from '@contember/react-binding'
import { Message, SpinnerOverlay } from '@contember/ui'
import { ReactNode, useEffect } from 'react'

export interface FeedbackRendererProps {
	accessorTreeState: AccessorTreeState
	children?: ReactNode
}

export function FeedbackRenderer({ accessorTreeState, children }: FeedbackRendererProps) {
	useEffect(() => {
		if (accessorTreeState.name === 'error' && accessorTreeState.error.type === 'unauthorized') {
			window.location.href = '/' // redirect to login
		}
	}, [accessorTreeState])

	if (accessorTreeState.name === 'initializing') {
		return <SpinnerOverlay />
	}

	if (accessorTreeState.name === 'error') {
		if (accessorTreeState.error.type === 'unauthorized') {
			return null // This results in a redirect for now, and so the actual handling is in an effect
		}
		if (import.meta.env.DEV) {
			throw accessorTreeState.error
		}

		return <Message intent="danger">{accessorTreeState.error.type}</Message>
	}

	return <>{children}</>
}
