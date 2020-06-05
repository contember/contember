import * as React from 'react'
import { AccessorProvider } from '../accessorPropagation'
import { EntityAccessor, EntityForRemovalAccessor } from '../accessors'

export interface SingleEntityBaseProps {
	accessor: EntityAccessor | EntityForRemovalAccessor
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

export function SingleEntity<EntityProps>(props: SingleEntityProps<EntityProps>) {
	if ('entityComponent' in props && props.entityComponent) {
		return React.createElement(props.entityComponent, {
			...props.entityProps!,
			accessor: props.accessor,
			children: props.children,
		})
	}
	return <AccessorProvider accessor={props.accessor}>{props.children}</AccessorProvider>
}
