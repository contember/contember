import { ReactNode, useEffect, useState } from 'react'
import { AccessorTreeState, DataBindingProvider } from '@contember/interface'
import { Loader } from '../ui/loader'

export const Binding = ({ children }: {
	children: ReactNode
}) => {
	return (
		<DataBindingProvider stateComponent={BindingStateRenderer}>
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
		return <DelayedLoader />
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

const DelayedLoader = () => {
	const [show, setShow] = useState(false)
	useEffect(() => {
		const timeout = setTimeout(() => setShow(true), 500)
		return () => clearTimeout(timeout)
	}, [])

	return show ? <Loader /> : null
}
