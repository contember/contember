import { ComponentType, createElement, ReactElement, ReactNode } from 'react'
import type { EntityListAccessor } from '../accessors'
import { Component } from './Component'
import { Entity } from './Entity'

export interface EntityListBaseProps {
	accessor: EntityListAccessor
	children?: ReactNode
}

export type EntityListProps<ListProps> = EntityListBaseProps &
	(
		| {}
		| {
				listComponent: ComponentType<ListProps & EntityListBaseProps>
				listProps?: ListProps
		  }
	)

export const EntityList = Component(
	<ListProps extends {}>(props: EntityListProps<ListProps>) => {
		if ('listComponent' in props && props.listComponent) {
			return createElement(props.listComponent, {
				...props.listProps!,
				accessor: props.accessor,
				children: props.children,
			})
		}
		return (
			<>
				{Array.from(props.accessor, entity => {
					return (
						<Entity key={entity.id ?? entity.key} accessor={entity}>
							{props.children}
						</Entity>
					)
				})}
			</>
		)
	},
	<ListProps extends {}>(props: EntityListProps<ListProps>) => {
		if ('listComponent' in props && props.listComponent) {
			return createElement(props.listComponent, {
				...props.listProps!,
				accessor: undefined as any,
				children: props.children,
			})
		}
		return <>{props.children}</>
	},
	'EntityList',
) as <ListProps>(props: EntityListProps<ListProps>) => ReactElement
