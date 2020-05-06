import * as React from 'react'
import { EntityAccessor, EntityForRemovalAccessor } from '../accessors'
import { AccessorContext } from './AccessorContext'

export interface EntityProviderProps {
	value: undefined | EntityAccessor | EntityForRemovalAccessor
	children: React.ReactNode
}

export function AccessorProvider(props: EntityProviderProps) {
	return React.createElement(AccessorContext.Provider, props)
}
