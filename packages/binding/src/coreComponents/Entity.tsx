import * as React from 'react'
import { AccessorProvider } from '../accessorPropagation'
import { EntityAccessor } from '../accessors'

export interface EntityProps {
	accessor: EntityAccessor
	children: React.ReactNode
}

// TODO this allows for some errors to never be rendered.
export const Entity = React.memo((props: EntityProps) => (
	<AccessorProvider value={props.accessor}>{props.children}</AccessorProvider>
))
