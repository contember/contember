import * as React from 'react'
import { BindingOperations } from '../accessors'
import { BindingOperationsContext, defaultBindingOperations } from './BindingOperationsContext'

export interface BindingOperationsProviderProps {
	bindingOperations: BindingOperations | undefined
	children: React.ReactNode
}

export function BindingOperationsProvider(props: BindingOperationsProviderProps) {
	return (
		<BindingOperationsContext.Provider value={props.bindingOperations || defaultBindingOperations}>
			{props.children}
		</BindingOperationsContext.Provider>
	)
}
