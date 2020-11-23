import * as React from 'react'
import { AccessorProvider } from '../accessorPropagation'
import { EntityAccessor } from '../accessors'
import { Component } from './Component'

export interface EntityBaseProps {
	accessor: EntityAccessor
	children?: React.ReactNode
}

export type EntityProps<EntityComponentProps> = EntityBaseProps &
	(
		| {}
		| {
				entityComponent: React.ComponentType<EntityComponentProps & EntityBaseProps>
				entityProps?: EntityComponentProps
		  }
	)

export const Entity = Component(<EntityComponentProps extends {}>(props: EntityProps<EntityComponentProps>) => {
	if ('entityComponent' in props && props.entityComponent) {
		return React.createElement(props.entityComponent, {
			...props.entityProps!,
			accessor: props.accessor,
			children: props.children,
		})
	}
	return <AccessorProvider accessor={props.accessor}>{props.children}</AccessorProvider>
}, 'Entity') as <EntityComponentProps extends {}>(props: EntityProps<EntityComponentProps>) => React.ReactElement
