import type { ComponentType, ReactElement, ReactNode } from 'react'
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
	let children = props.children

	if ('entityComponent' in props && props.entityComponent) {
		const EntityComponent = props.entityComponent

		children = (
			// HACK: the ?. is actually important, despite the typings.
			<EntityComponent {...props.entityProps!} accessor={props.accessor} key={props.accessor?.key}>
				{children}
			</EntityComponent>
		)
	}
	return (
		// HACK: the ?. is actually important, despite the typings.
		<AccessorProvider accessor={props.accessor} key={props.accessor?.key}>
			{children}
		</AccessorProvider>
	)
}, 'Entity') as <EntityComponentProps extends {}>(props: EntityProps<EntityComponentProps>) => ReactElement
