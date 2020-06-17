import * as React from 'react'
import { EntityAccessor } from '../accessors'
import { EntityKeyContext } from './EntityKeyContext'

export interface EntityProviderProps {
	accessor: EntityAccessor
	children: React.ReactNode
}

export function AccessorProvider(props: EntityProviderProps) {
	return <EntityKeyContext.Provider value={props.accessor.key}>{props.children}</EntityKeyContext.Provider>
}
