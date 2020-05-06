import * as React from 'react'
import { EntityAccessor, EntityForRemovalAccessor } from '../accessors'
import { EntityKeyContext } from './EntityKeyContext'

export interface EntityProviderProps {
	value: undefined | EntityAccessor | EntityForRemovalAccessor
	children: React.ReactNode
}

export function AccessorProvider(props: EntityProviderProps) {
	return <EntityKeyContext.Provider value={props.value?.key}>{props.children}</EntityKeyContext.Provider>
}
