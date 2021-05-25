import { ComponentType, createElement, ReactElement, ReactNode } from 'react'
import { AccessorProvider } from '../accessorPropagation'
import type { EntityAccessor } from '../accessors'
import { Component } from './Component'

export interface EntityBaseProps {
	accessor: EntityAccessor
	children?: ReactNode
}

export type EntityProps<EntityComponentProps> = EntityBaseProps &
	(
		| {}
		| {
				entityComponent: ComponentType<EntityComponentProps & EntityBaseProps>
				entityProps?: EntityComponentProps
		  }
	)

export const Entity = Component(<EntityComponentProps extends {}>(props: EntityProps<EntityComponentProps>) => {
	if ('entityComponent' in props && props.entityComponent) {
		return createElement(props.entityComponent, {
			...props.entityProps!,
			accessor: props.accessor,
			children: props.children,
		})
	}
	return <AccessorProvider accessor={props.accessor}>{props.children}</AccessorProvider>
}, 'Entity') as <EntityComponentProps extends {}>(props: EntityProps<EntityComponentProps>) => ReactElement
