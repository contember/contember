import type { ReactNode } from 'react'
import { AccessorProvider } from '../accessorPropagation'
import type { EntityAccessor } from '../accessors'
import { Component } from './Component'

export interface EntityBaseProps {
	accessor: EntityAccessor
	children?: ReactNode
}

export type EntityProps = EntityBaseProps

export const Entity = Component(
	({ children, accessor }: EntityProps) => {
	return (
		// HACK: the ?. is actually important, despite the typings.
		<AccessorProvider accessor={accessor} key={accessor?.id ?? accessor?.key}>
			{children}
		</AccessorProvider>
	)
	},
	'Entity',
)
