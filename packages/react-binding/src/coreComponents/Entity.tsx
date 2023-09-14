import type { ReactNode } from 'react'
import { AccessorProvider } from '../accessorPropagation'
import type { EntityAccessor } from '@contember/binding'
import { Component } from './Component'

export interface EntityBaseProps {
	accessor: EntityAccessor
	children?: ReactNode
}

export type EntityProps = EntityBaseProps

/**
 * @group Data binding
 */
export const Entity = Component(
	({ children, accessor }: EntityProps) => {
	return (
		// HACK: the ?. is actually important, despite the typings.
		<AccessorProvider accessor={accessor} key={accessor?.key}>
			{children}
		</AccessorProvider>
	)
	},
	'Entity',
)
