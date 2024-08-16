import { ReactNode, useEffect } from 'react'
import { AccessorTreeState, DataBindingProvider } from '@contember/interface'
import { Loader } from '../ui/loader'
import { NavigationGuardDialog } from './navigation-guard-dialog'

export const Binding = ({ children }: {
	children: ReactNode
}) => {
	return (
		<DataBindingProvider stateComponent={BindingStateRenderer}>
			<NavigationGuardDialog />
			{children}
		</DataBindingProvider>
	)
}

export interface BindingStateRendererProps {
	accessorTreeState: AccessorTreeState
	children?: ReactNode
}


function BindingStateRenderer({ accessorTreeState, children }: BindingStateRendererProps) {
	useEffect(() => {
		if (accessorTreeState.name === 'error' && accessorTreeState.error.type === 'unauthorized') {
			window.location.href = '/' // redirect to login
		}
	}, [accessorTreeState])

	if (accessorTreeState.name === 'initializing') {
		return <Loader />
	}

	if (accessorTreeState.name === 'error') {
		if (accessorTreeState.error.type === 'unauthorized') {
			return null // This results in a redirect for now, and so the actual handling is in an effect
		}
		if (import.meta.env.DEV) {
			throw accessorTreeState.error
		}

		return <div>{accessorTreeState.error.type}</div>
	}

	return <>{children}</>
}

