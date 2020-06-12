import * as React from 'react'
import { AccessorProvider } from '../accessorPropagation'
import { EntityAccessor } from '../accessors'
import { Component } from './Component'

export interface SingleEntityBaseProps {
	accessor: EntityAccessor
	children?: React.ReactNode
}

export type SingleEntityProps<EntityProps> = SingleEntityBaseProps &
	(
		| {}
		| {
				entityComponent: React.ComponentType<EntityProps & SingleEntityBaseProps>
				entityProps?: EntityProps
		  }
	)

export const SingleEntity = Component(<EntityProps extends {}>(props: SingleEntityProps<EntityProps>) => {
	if ('entityComponent' in props && props.entityComponent) {
		return React.createElement(props.entityComponent, {
			...props.entityProps!,
			accessor: props.accessor,
			children: props.children,
		})
	}
	return <AccessorProvider accessor={props.accessor}>{props.children}</AccessorProvider>
}, 'SingleEntity') as <EntityProps extends {}>(props: SingleEntityProps<EntityProps>) => React.ReactElement
