import * as React from 'react'
import { AccessorContext } from '../accessorRetrievers'
import { EntityAccessor } from '../accessors'

export interface EntityProps {
	accessor: EntityAccessor
	children: React.ReactNode
}

// TODO this allows for some errors to never be rendered.
export const Entity = React.memo((props: EntityProps) => (
	<AccessorContext.Provider value={props.accessor}>{props.children}</AccessorContext.Provider>
))
