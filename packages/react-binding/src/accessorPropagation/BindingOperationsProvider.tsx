import type { ReactNode } from 'react'
import type { BindingOperations } from '@contember/binding'
import { BindingOperationsContext, defaultBindingOperations } from './BindingOperationsContext'

export interface BindingOperationsProviderProps {
	bindingOperations: BindingOperations<ReactNode> | undefined
	children: ReactNode
}

export function BindingOperationsProvider(props: BindingOperationsProviderProps) {
	return (
		<BindingOperationsContext.Provider value={props.bindingOperations || defaultBindingOperations}>
			{props.children}
		</BindingOperationsContext.Provider>
	)
}
